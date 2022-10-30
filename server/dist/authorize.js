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
exports.handler = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    let token = event.headers["Authorization"].split(" ")[1];
    if (!token) {
        return {
            statusCode: 403,
            body: JSON.stringify({ isAuthorized: false }),
        };
    }
    let secret = process.env.SECRET_KEY;
    (0, jsonwebtoken_1.verify)(token, secret, (err, decoded) => {
        if (err) {
            return {
                statusCode: 403,
                body: JSON.stringify({ isAuthorized: false }),
            };
        }
        else if (decoded) {
            return {
                statusCode: 200,
                body: JSON.stringify({ isAuthorized: true }),
            };
        }
    });
    return {
        statusCode: 200,
        body: JSON.stringify({ isAuthorized: true }),
    };
});
exports.handler = handler;
