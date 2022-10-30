"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.handler = exports.User = void 0;
const db_1 = require("./db");
const ydb_sdk_1 = require("ydb-sdk");
const uuidv4_1 = require("uuidv4");
const jsonwebtoken_1 = require("jsonwebtoken");
const SYNTAX_V1 = "--!syntax_v1";
let User = class User extends ydb_sdk_1.TypedData {
    constructor(data) {
        super(data);
        this.id = (0, uuidv4_1.uuid)();
        this.login = data.login;
        this.password = data.password;
    }
};
__decorate([
    (0, ydb_sdk_1.declareType)(ydb_sdk_1.Types.UTF8)
], User.prototype, "id", void 0);
__decorate([
    (0, ydb_sdk_1.declareType)(ydb_sdk_1.Types.UTF8)
], User.prototype, "login", void 0);
__decorate([
    (0, ydb_sdk_1.declareType)(ydb_sdk_1.Types.UTF8)
], User.prototype, "password", void 0);
User = __decorate([
    (0, ydb_sdk_1.withTypeOptions)({ namesConversion: ydb_sdk_1.snakeToCamelCaseConversion })
], User);
exports.User = User;
function upsertUser(session, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
${SYNTAX_V1}
DECLARE $id AS Utf8;
DECLARE $login AS Utf8;
DECLARE $password AS Utf8;
UPSERT INTO users (id, login, password) VALUES
($id, $login, $password);`;
        const preparedQuery = yield session.prepareQuery(query);
        yield session.executeQuery(preparedQuery, {
            $id: ydb_sdk_1.TypedValues.utf8(user.id),
            $login: ydb_sdk_1.TypedValues.utf8(user.login),
            $password: ydb_sdk_1.TypedValues.utf8(user.password),
        });
    });
}
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    let driver = yield (0, db_1.initDb)();
    let data = JSON.parse(event.body);
    let user = new User(data);
    yield driver.tableClient.withSession((session) => __awaiter(void 0, void 0, void 0, function* () {
        yield upsertUser(session, user);
    }));
    driver.destroy();
    let secret = process.env.SECRET_KEY;
    let token = (0, jsonwebtoken_1.sign)({ data: user }, secret, { expiresIn: '2h', });
    return {
        statusCode: 201,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token }),
    };
});
exports.handler = handler;
