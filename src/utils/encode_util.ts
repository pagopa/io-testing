// tslint:disable: no-any
export const base64EncodeObject = (_: any) => {
  return Buffer.from(JSON.stringify(_)).toString("base64");
};
