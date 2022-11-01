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

//Проверка уникальности логина
async function existsUser(session: Session, login: string): Promise<number> {
  const query = `
  ${SYNTAX_V1}
  DECLARE $login AS Utf8;
  SELECT * FROM users WHERE login = $login`;
  const preparedQuery = await session.prepareQuery(query);
  const { resultSets } = await session.executeQuery(preparedQuery, {
    $login: TypedValues.utf8(login),
  });
  return resultSets[0].rows?.length ?? 0;
}

//Добавление пользователя в базу данных
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
  const driver = await initDb();
  const requestData: IUser = JSON.parse(event.body);
  const user = new User(requestData);
  let usersCount = 0;
  await driver.tableClient.withSession(async (session) => {
    usersCount = await existsUser(session, requestData.login);
    if(usersCount == 0)
        await upsertUser(session, user);
  });
  driver.destroy();
  if (usersCount > 0) {
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Пользователь с таким логином уже зарегистрирован",
      }),
    };
  }
  let secret = process.env.SECRET_KEY as Secret;
  let token = sign({ data: user }, secret, { expiresIn: "2h" });
  return {
    statusCode: 201,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: token }),
  };
};
