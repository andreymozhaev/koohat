"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = void 0;
const ydb_sdk_1 = require("ydb-sdk");
function initDb() {
    return __awaiter(this, void 0, void 0, function* () {
        const authService = (0, ydb_sdk_1.getCredentialsFromEnv)();
        console.log("Driver initializing...");
        const driver = new ydb_sdk_1.Driver({ endpoint: process.env.YDB_ENDPOINT, database: process.env.YDB_DATABASE, authService });
        const timeout = 10000;
        if (!(yield driver.ready(timeout))) {
            console.error(`Driver has not become ready in ${timeout}ms!`);
            process.exit(1);
        }
        return driver;
    });
}
exports.initDb = initDb;
