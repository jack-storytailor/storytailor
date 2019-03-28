import * as fs from 'fs';
import * as path from 'path';

export const mkDirByPathSync = (targetDir: string, { isRelativeToScript = false } = {}) => {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';
  targetDir = path.normalize(targetDir);

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      if (fs.existsSync(curDir)) {
        return curDir;
      }
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && targetDir === curDir) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

export const copyDirectory = (fromPath, toPath, excludePattern?: RegExp[], includePattern?: RegExp[]) => {
  if (!fs.existsSync(fromPath)) {
    console.log('directory ' + toPath + ' does not exists');
    return;
  }

  if (excludePattern) {
    for (let i = 0; i < excludePattern.length; i++) {
      const pattern = excludePattern[i];
      if (pattern.test(fromPath)) {
        return;
      }
    }
  }

  if (includePattern) {
    for (let i = 0; i < includePattern.length; i++) {
      const pattern = includePattern[i];
      if (!pattern.test(fromPath)) {
        return;
      }
    }
  }

  if (!fs.statSync(fromPath).isDirectory()) {
    console.log(fromPath, 'is not a directory');
    return;
  }

  if (!fs.existsSync(toPath)) {
    console.log('directory ' + toPath + ' does not exists. creating it');
    mkDirByPathSync(toPath);
  }

  let itemNames = fs.readdirSync(fromPath);
  if (!itemNames || itemNames.length <= 0) {
    console.log(fromPath + 'does not have subitems');
    return;
  }

  itemNames.forEach((subitem) => {
    let subitemPath = fromPath + '/' + subitem;
    let targetSubitemPath = toPath + '/' + subitem;

    if (fs.statSync(subitemPath).isDirectory()) {
      copyDirectory(subitemPath, targetSubitemPath);
      return;
    }

    fs.writeFileSync(targetSubitemPath, fs.readFileSync(subitemPath));
  });
} 

export const getFileNames = (dirPath: string, isRecoursive: boolean): string[] => {
  if (!fs.existsSync(dirPath)) {
    return undefined;
  }

  let files: string[] = [];

  const subitemNames = fs.readdirSync(dirPath);
  subitemNames.forEach((subitemName: string) => {
    if (subitemName === '.' || subitemName === '..') {
      return;
    }

    const fullPath = dirPath + '/' + subitemName;

    // check is directory
    if (fs.statSync(fullPath).isDirectory()) {
      // read dir with it's subitems
      if (isRecoursive) {
        let subitems = getFileNames(fullPath, isRecoursive);
        if (subitems) {
          files = [
            ...files,
            ...subitems
          ];
        }
      }
    }
    // otherwise it's file
    else {
      files = [
        ...files,
        fullPath
      ]
    }
  });

  return files;
}

export const getFileNamesAndFilter = (rootPath: string, isRecoursive: boolean, include?: RegExp[], exclude?: RegExp[]): string[] => {
  let unfilteredFileNames = getFileNames(rootPath, isRecoursive);
  if (!unfilteredFileNames) {
    return undefined;
  }

  let filteredFileNames = filterFileNames(unfilteredFileNames, rootPath, include, exclude);
  return filteredFileNames;
}

export const filterFileNames = (fileNames: string[], rootDirPath: string, include?: RegExp[], exclude?: RegExp[]): string[] => {
  if (!fileNames || !rootDirPath) {
    return fileNames;
  }

  if (!include && !exclude) {
    return fileNames;
  }

  let relativeFileNames = fileNames.map((fileName: string) => getRelativeFileName(fileName, rootDirPath));

  if (include) {
    relativeFileNames = relativeFileNames.filter((fileName: string) => {
      let isIncluded = include.some((pattern: RegExp) => pattern instanceof RegExp && pattern.test(fileName));
      return isIncluded;
    });
  }

  if (exclude) {
    relativeFileNames = relativeFileNames.filter((fileName: string) => {
      let isExcluded = exclude.some((pattern: RegExp) => pattern instanceof RegExp && pattern.test(fileName));
      return !isExcluded;
    });
  }

  let result = relativeFileNames.map((relativeFileName: string) => {
    let fileName = path.resolve(rootDirPath, relativeFileName);
    return fileName;
  });

  return result;
}

export const getRelativeFileName = (filePath: string, relativeTo: string): string => {
  if (!filePath || !relativeTo) {
    return filePath;
  }
  let fileDir = path.dirname(filePath);
  let relativeToRoot = path.relative(relativeTo, fileDir);
  if (relativeToRoot === '') {
    relativeToRoot = '.';
  }
  let result = path.normalize(relativeToRoot + '/' + path.basename(filePath));
  return result;
}
