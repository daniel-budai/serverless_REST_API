import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { v4 } from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient();

export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const reqBody = JSON.parse(event.body as string);
  const product = { ...reqBody, productID: v4() };
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

export const getProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id; //? because id may be undefined

  const output = await docClient.get({ TableName: "tableName", Key: { productID: id } }).promise();
  if (!output.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(output.Item),
  };
};
