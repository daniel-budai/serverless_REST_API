import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { v4 } from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient();

export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const reqBody = JSON.parse(event.body as string);

  const product = {
    ...reqBody,
    productID: v4(),
  };

  const tableName = "ProductsTable";

  await docClient
    .put({
      TableName: tableName,
      Item: product,
    })
    .promise();

  return {
    statusCode: 201, // 201 Created
    body: JSON.stringify(product),
  };
};

class HttpError extends Error {
  constructor(public statusCode: number, body: Record<string, unknown> = {}) {
    super(JSON.stringify({ body }));
  }
}

const fetchProductById = async (id: string) => {
  const output = await docClient
    .get({
      TableName: "ProductsTable",
      Key: { productID: id },
    })
    .promise();

  if (!output.Item) {
    throw new HttpError(404, { message: "Product not found" });
  }
  return output.Item;
};

const handleError = (e: unknown) => {
  if (e instanceof HttpError) {
    return {
      statusCode: e.statusCode,
      body: e.message,
    };
  }
  throw e;
};

export const getProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id; //? because id may be undefined

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product ID is required" }),
      };
    }

    const output = await docClient.get({ TableName: "ProductsTable", Key: { productID: id } }).promise();
    if (!output.Item) {
      throw new HttpError(404, { message: "Product not found" });
    }
    return {
      statusCode: 200,
      body: JSON.stringify(output.Item),
    };
  } catch (error) {
    console.error("Error getting product:", error);
    return handleError(error);
  }
};

export const updateProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    await fetchProductById(id);

    const reqBody = JSON.parse(event.body as string);

    const product = {
      ...reqBody,
      productID: id,
    };

    const tableName = "ProductsTable";

    await docClient
      .put({
        TableName: tableName,
        Item: product,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (e) {
    return handleError(e);
  }
};

export const deleteProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;
    await fetchProductById(id);

    await docClient
      .delete({
        TableName: "ProductsTable",
        Key: { productID: id },
      })
      .promise();
    return { statusCode: 204, body: "" };
  } catch (e) {
    return handleError(e);
  }
};

export const listProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const output = await docClient.scan({ TableName: "ProductsTable" }).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(output.Items),
  };
};
