const getLogger = require('./logger');
const log = getLogger('main');
const FILESPATH = './test/data';
const FILETYPE = '.xml';
const HEADERSPATH = './test/data/Headers_ex2.txt'
const XLSXFILENAME = 'excel.xlsx'
const CFDIparse = require('./CFDI.parse');
let fileUtils = require('./fileUtils.js');
let getHeadersFromFile = require('./getHeadersFromFile.js');
let xlsxGenerator = require('./xlsxGenerator').xlsxGenerator;
let Headers;
let xlsxGen;

function start() {
    getHeadersFromFile(HEADERSPATH).then(headers => {
        log.trace('Headers parsed:', headers);
        Headers = headers;
        xlsxGen = new xlsxGenerator(XLSXFILENAME, headers);
        return fileUtils.loadFileList(FILESPATH, FILETYPE);
    })
        .then(processFileList)
        .then(() => {
            log.trace('FileList process finished.');
            xlsxGen.sortDataByColumn();
            return xlsxGen.saveData()

        }).then(ok => {
            log.debug('File saved');
            return ok;
        })
        .catch(err => {
            log.fatal("Error:", err);
        })

}
function getRow(dataFile) {
    let CFDI = new CFDIparse();
    return CFDI.load(dataFile).then((result) => {
        log.info("expected values according to headers", CFDI.getRow(Headers.headers));
        return CFDI.getRow(Headers.headers);
    });
}

function processFileList(fileList) {
    log.trace("Starting fileList Processing:", fileList);
    let allPromises = fileList.map((file, i, arr) => {
        log.trace("Starting process with:", file);
        return fileUtils.readFile(file).then(dataFile => {
            log.trace("Finished file read:", file, "size:", dataFile.length);
            return getRow(dataFile);
        }).then((row) => {
            xlsxGen.add(row);
        }).catch((e) => {
            log.warn("File %s cant be parsed.", file, e);
        });
    });
    return Promise.all(allPromises);
}


start();