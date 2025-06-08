# Key Management Guide

This document outlines the process for generating, storing, rotating, and backing up the cryptographic keys used in the Image-Sign application.

## 1. Key Generation

The application uses an RSA key pair for signing and verifying image signatures. The private key is used to sign images, and the public key is used to verify them.

You will need `openssl` installed to generate the keys.

### Generate the Private Key

Run the following command to generate a 2048-bit RSA private key:

```bash
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
```

This will create a file named `private_key.pem` in your current directory.

### Extract the Public Key

Run the following command to extract the public key from your private key:

```bash
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

This will create a file named `public_key.pem`.

## 2. Storing Keys in the Environment

The application reads the keys from environment variables. You need to format them correctly to be stored in a single line.

### Private Key

The private key needs to be stored in the `SIGNING_PRIVATE_KEY` environment variable.

1.  Open the `private_key.pem` file.
2.  Copy the content, **excluding** the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines.
3.  Remove all newline characters to make it a single line.

Your private key in the `.env.local` file should look like this (this is just an example):

```
SIGNING_PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC2...
```

### Public Key

The public key needs to be stored in the `SIGNING_PUBLIC_KEY` environment variable for the verification service.

1.  Open the `public_key.pem` file.
2.  Copy the content, **excluding** the `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----` lines.
3.  Remove all newline characters to make it a single line.

Your public key in the `.env.local` file should look like this (this is just an example):

```
SIGNING_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2...
```

**IMPORTANT:** After setting the environment variables, securely delete the `.pem` files from your local machine.

## 3. Storing Keys in Vercel

For production, you should store these keys as encrypted environment variables in Vercel.

1.  Go to your project settings in Vercel.
2.  Navigate to the "Environment Variables" section.
3.  Add `SIGNING_PRIVATE_KEY` and `SIGNING_PUBLIC_KEY` with their respective values.
4.  Ensure they are set for the "Production" environment. Vercel automatically encrypts these variables.

## 4. Key Rotation (Quarterly)

You should rotate the keys every quarter to enhance security.

**Rotation Process:**

1.  **Generate a new key pair:** Follow the steps in section 1 to generate a new private and public key.
2.  **Update Vercel:**
    - Add the new public key as `NEW_SIGNING_PUBLIC_KEY` and the new private key as `NEW_SIGNING_PRIVATE_KEY` in Vercel's environment variables.
    - **Do not** remove the old keys yet.
3.  **Deploy the application:** The application should be updated to support key rotation. The verification logic should be able to check against both the old and new public keys.
4.  **Transition Period:**
    - The signing service will now use the `NEW_SIGNING_PRIVATE_KEY` to sign new images.
    - The verification service will check signatures against `SIGNING_PUBLIC_KEY` and `NEW_SIGNING_PUBLIC_KEY`.
5.  **Complete Rotation:**
    - After a transition period (e.g., one week) where you are confident all new signatures are using the new key, you can update the environment variables in Vercel.
    - Rename `NEW_SIGNING_PUBLIC_KEY` to `SIGNING_PUBLIC_KEY`.
    - Rename `NEW_SIGNING_PRIVATE_KEY` to `SIGNING_PRIVATE_KEY`.
    - You can now remove the `NEW_` prefixed variables.

## 5. Key Backup in AWS KMS

For disaster recovery, you should back up the private key in AWS Key Management Service (KMS).

**Backup Process:**

1.  **Go to AWS KMS:** Navigate to the KMS console in your AWS account.
2.  **Create a new Customer Managed Key (CMK):**
    - Choose a symmetric key.
    - Give it an alias (e.g., `image-sign-private-key-backup`).
    - Define key administrative and usage permissions.
3.  **Encrypt the private key:**
    - Use the AWS CLI or SDK to encrypt your private key file (`private_key.pem`) using the newly created CMK.
    - `aws kms encrypt --key-id <your-kms-key-id> --plaintext fileb://private_key.pem --output text --query CiphertextBlob > encrypted_private_key.b64`
4.  **Store the encrypted key:**
    - Store the base64-encoded ciphertext (`encrypted_private_key.b64`) in a secure location, such as AWS S3 with restricted access, or in AWS Secrets Manager.

**Restoration Process:**

In case you need to restore the key:

1.  Retrieve the encrypted key from your secure storage.
2.  Use AWS KMS to decrypt it:
    - `aws kms decrypt --ciphertext-blob fileb://encrypted_private_key.b64 --output text --query Plaintext | base64 --decode > restored_private_key.pem`
3.  You can now use the `restored_private_key.pem` to update your environment variables in Vercel.
