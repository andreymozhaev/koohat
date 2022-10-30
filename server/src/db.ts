import { getCredentialsFromEnv, Driver } from "ydb-sdk";

export async function initDb():Promise<Driver> {
  const authService = getCredentialsFromEnv();
  console.log("Driver initializing...");
  const driver = new Driver({ endpoint: process.env.YDB_ENDPOINT, database: process.env.YDB_DATABASE, authService });
  const timeout = 10000;
  if (!(await driver.ready(timeout))) {
    console.error(`Driver has not become ready in ${timeout}ms!`);
    process.exit(1);
  }
  return driver;
}
