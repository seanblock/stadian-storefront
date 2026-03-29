"use server";

import { getStadianClient } from "@/lib/stadian";
import { getCustomerToken } from "./auth";
import type {
  StorefrontIntakeForm,
  StorefrontIntakeSubmission,
} from "@stadian/storefront-sdk";

export async function getIntakeForm(
  productId: string
): Promise<StorefrontIntakeForm> {
  const client = getStadianClient();
  return client.intake.getForm(productId);
}

export async function submitIntakeForm(data: {
  intakeFormId: string;
  productId?: string;
  responses: Record<string, unknown>;
}): Promise<StorefrontIntakeSubmission> {
  const token = await getCustomerToken();
  if (!token) throw new Error("You must be logged in to submit an intake form");

  const client = getStadianClient();
  return client.intake.submit({
    intakeFormId: data.intakeFormId,
    customerToken: token,
    responses: data.responses,
    productId: data.productId,
  });
}

export async function getIntakeStatus(
  submissionId: string
): Promise<StorefrontIntakeSubmission> {
  const client = getStadianClient();
  return client.intake.getStatus(submissionId);
}
