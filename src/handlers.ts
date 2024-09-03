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
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product ID is required" }),
      };
    }

    const params = {
      TableName: "ProductsTable",
      Key: { productID: id },
    };

    const result = await docClient.get(params).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error("Error getting product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
