import { Handler } from "@yandex-cloud/function-types";
import { Secret, verify } from "jsonwebtoken";

export const handler: Handler.Http = async (event, context) => {
  let token = event.headers["Authorization"].split(" ")[1];
  if (!token) {
    return {
      statusCode: 403,
      body: JSON.stringify({ isAuthorized: false }),
    };
  }
  let secret = process.env.SECRET_KEY as Secret;
  verify(token, secret, (err, decoded) => {
    if(err){
      return {
        statusCode: 403,
        body: JSON.stringify({ isAuthorized: false }),
      };
    }
    else if(decoded){
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
};
