import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "~/server/db";
import { API_TOKEN_SECRET, encrypt, generateInstanceSecret } from "~/utils/encryption";
import {
	GET_orgUserNetworks,
	POST_orgCreateNewNetwork,
} from "~/pages/api/v1/org/[orgid]/network";

jest.mock("~/server/db", () => ({
	prisma: {
		user: {
			count: jest.fn(),
			create: jest.fn(),
			findUnique: jest.fn().mockResolvedValue({
				id: "userId",
				role: "ADMIN",
				apiTokens: [
					{
						// Assuming your actual `apiTokens` structure looks something like this
						token: "testToken",
						tokenId: "testTokenId",
						expiresAt: new Date(Date.now() + 100000).toISOString(), // Simulate a future expiration
					},
				],
			}),
		},
		aPIToken: {
			findUnique: jest.fn().mockResolvedValue({
				expiresAt: new Date(Date.now() + 100000).toISOString(), // Simulate a future expiration
				token: "testToken",
				tokenId: "testTokenId",
			}),
		},
	},
}));

describe("organization network api validation", () => {
	let mockRequest: Partial<NextApiRequest>;
	let mockResponse: Partial<NextApiResponse>;

	// biome-ignore lint/correctness/noUnusedVariables: <explanation>
	let jsonResponse: string;
	// biome-ignore lint/correctness/noUnusedVariables: <explanation>
	let statusCode: number;

	beforeEach(() => {
		jsonResponse = null;
		statusCode = null;
		mockRequest = {
			headers: {},
			body: {},
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn((result) => {
				jsonResponse = result;
				return mockResponse;
			}),
		};
	});
	afterEach(() => {
		// Restores all mocks back to their original value.
		// only works when the mock was created with jest.spyOn;
		jest.restoreAllMocks();
	});
	test('POST_orgCreateNewNetwork should throw "Invalid Token"', async () => {
		// mock req.query?.orgid
		mockRequest.query = { orgid: "testOrgId" };

		prisma.user.count = jest.fn().mockResolvedValue(0);
		// mock prisma transaction
		prisma.$transaction = jest
			.fn()
			.mockResolvedValue({ id: "newUserId", name: "Ztnet", email: "post@ztnet.network" });

		mockRequest.headers["x-ztnet-auth"] = "not valid token";

		await POST_orgCreateNewNetwork(
			mockRequest as NextApiRequest,
			mockResponse as NextApiResponse,
		);
		expect(mockResponse.status).toHaveBeenCalledWith(401);
		// check if the response is correct. invalid token
		expect(mockResponse.json).toHaveBeenCalledWith({ error: "Invalid token" });
	});

	test('POST_orgCreateNewNetwork should throw "Invalid Authorization Type" for mismatched authorization types', async () => {
		// Mock decrypt function to return a payload that simulates a mismatched authorization type
		const tokendata = JSON.stringify({
			userId: "testUserId",
			tokenId: "testTokenId",
			apiAuthorizationType: ["PERSONAL"],
		});

		const tokenWithIdHash = encrypt(tokendata, generateInstanceSecret(API_TOKEN_SECRET));
		mockRequest.headers["x-ztnet-auth"] = tokenWithIdHash;
		try {
			await POST_orgCreateNewNetwork(
				mockRequest as NextApiRequest,
				mockResponse as NextApiResponse,
			);
		} catch (error) {
			expect(error.message).toBe("Invalid Authorization Type");
		}
	});

	test('GET_orgUserNetworks should throw "Invalid Token"', async () => {
		// mock req.query?.orgid
		mockRequest.query = { orgid: "testOrgId" };

		prisma.user.count = jest.fn().mockResolvedValue(0);
		// mock prisma transaction
		prisma.$transaction = jest
			.fn()
			.mockResolvedValue({ id: "newUserId", name: "Ztnet", email: "post@ztnet.network" });

		mockRequest.headers["x-ztnet-auth"] = "not valid token";

		await GET_orgUserNetworks(
			mockRequest as NextApiRequest,
			mockResponse as NextApiResponse,
		);
		expect(mockResponse.status).toHaveBeenCalledWith(401);
		// check if the response is correct. invalid token
		expect(mockResponse.json).toHaveBeenCalledWith({ error: "Invalid token" });
	});

	test('GET_orgUserNetworks should throw "Invalid Authorization Type" for mismatched authorization types', async () => {
		// Mock decrypt function to return a payload that simulates a mismatched authorization type
		const tokendata = JSON.stringify({
			userId: "testUserId",
			tokenId: "testTokenId",
			apiAuthorizationType: ["PERSONAL"],
		});

		const tokenWithIdHash = encrypt(tokendata, generateInstanceSecret(API_TOKEN_SECRET));
		mockRequest.headers["x-ztnet-auth"] = tokenWithIdHash;
		try {
			await GET_orgUserNetworks(
				mockRequest as NextApiRequest,
				mockResponse as NextApiResponse,
			);
		} catch (error) {
			expect(error.message).toBe("Invalid Authorization Type");
		}
	});
});