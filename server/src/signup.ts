import { Handler } from "@yandex-cloud/function-types";
import { initDb } from "./db";
import {
  Session,
  TypedData,
  declareType,
  Types,
  withTypeOptions,
  snakeToCamelCaseConversion,
  TypedValues,
} from "ydb-sdk";
import { uuid } from "uuidv4";
import { Secret, sign } from "jsonwebtoken";

const SYNTAX_V1 = "--!syntax_v1";

interface IUser {
  login: string;
  password: string;
}

@withTypeOptions({ namesConversion: snakeToCamelCaseConversion })
export class User extends TypedData {
  @declareType(Types.UTF8)
  public id: string;
  @declareType(Types.UTF8)
  public login: string;
  @declareType(Types.UTF8)
  public password: string;

  constructor(data: IUser) {
    super(data);
    this.id = uuid();
    this.login = data.login;
    this.password = data.password;
  }
}

async function upsertUser(session: Session, user: User): Promise<void> {
  const query = `
${SYNTAX_V1}
DECLARE $id AS Utf8;
DECLARE $login AS Utf8;
DECLARE $password AS Utf8;
UPSERT INTO users (id, login, password) VALUES
($id, $login, $password);`;
  const preparedQuery = await session.prepareQuery(query);
  await session.executeQuery(preparedQuery, {
    $id: TypedValues.utf8(user.id),
    $login: TypedValues.utf8(user.login),
    $password: TypedValues.utf8(user.password),
  });
}

export const handler: Handler.Http = async (event, context) => {
  let driver = await initDb();
  let data: IUser = JSON.parse(event.body);
  let user = new User(data);
  await driver.tableClient.withSession(async (session) => {
    await upsertUser(session, user);
  });
  driver.destroy();
  let secret = process.env.SECRET_KEY as Secret;
  let token = sign({data: user}, secret, {expiresIn: '2h',});
  return {
    statusCode: 201,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({token: token}),
  };
};
