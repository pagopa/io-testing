import { right } from "fp-ts/lib/Either";
import * as asyncI from "io-functions-commons/dist/src/utils/async";
import { clearAllTestData } from "../clear_data";
// tslint:disable: no-any

const aModel = {
  id: "id",
  partitionKey: "partitionKey"
};

const anotherModel = {
  id: "id2",
  partitionKey: "partitionKey"
};

const resultsMock: ReadonlyArray<any> = [
  [right(aModel)],
  [right(anotherModel)]
];

const aModelIteratorMock = {
  next: jest.fn(() =>
    Promise.resolve({
      value: jest.fn(() => resultsMock)
    })
  )
};

const modelMock = {
  getQueryIterator: jest.fn(() => aModelIteratorMock)
};

const containerMock = {
  item: jest.fn((id: string, _: string) => ({
    delete: jest.fn(() =>
      Promise.resolve({
        item: {
          id
        }
      })
    )
  }))
};

jest.spyOn(asyncI, "flattenAsyncIterable").mockImplementationOnce(() => {
  return {
    [Symbol.asyncIterator]: () => aModelIteratorMock
  };
});

jest
  .spyOn(asyncI, "asyncIterableToArray")
  .mockImplementationOnce(() =>
    Promise.resolve([right(aModel), right(anotherModel)])
  );
describe("Clear Data", () => {
  it("should clear object data from an arbitrary collection on cosmos", async () => {
    await clearAllTestData(
      containerMock as any,
      modelMock,
      aModel,
      "partitionKey"
    )
      .fold(
        _ => fail("Cannot fail"),
        strArr => {
          expect(strArr).toBeDefined();
          expect(strArr).toContain("id");
          expect(strArr).toContain("id2");
        }
      )
      .run();
  });
});
