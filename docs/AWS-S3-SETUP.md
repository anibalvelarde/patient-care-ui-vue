# AWS S3 Static Hosting Setup

This guide covers setting up the `neurocorp` S3 bucket for static website hosting and creating AWS credentials for GitHub Actions. Choose either the **Console (browser)** or **CLI** path — both achieve the same result.

---

## Option A: AWS Console (Browser)

### 1. Create the S3 Bucket

1. Go to **AWS Console → S3 → Create bucket**
2. Bucket name: `neurocorp`
3. Region: `us-east-2`
4. **Uncheck** "Block all public access" and acknowledge the warning
5. Leave all other defaults and click **Create bucket**

### 2. Enable Static Website Hosting

1. Open the `neurocorp` bucket → **Properties** tab
2. Scroll to **Static website hosting** → click **Edit**
3. Select **Enable**
4. Index document: `index.html`
5. Error document: `index.html` (enables SPA client-side routing — any path that doesn't match a file returns `index.html` and Vue Router handles it)
6. Click **Save changes**

### 3. Set Bucket Policy for Public Access

1. Open the `neurocorp` bucket → **Permissions** tab
2. Under **Block public access**, click **Edit**, uncheck all boxes, and save (if not already done in step 1)
3. Under **Bucket policy**, click **Edit** and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::neurocorp/*"
    }
  ]
}
```

4. Click **Save changes**

### 4. Create IAM User for GitHub Actions

1. Go to **AWS Console → IAM → Users → Create user**
2. User name: `github-actions-neurocorp-deploy`
3. Do **not** enable console access — click **Next**
4. Choose **Attach policies directly** → click **Create policy**
5. Switch to the **JSON** tab and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::neurocorp",
        "arn:aws:s3:::neurocorp/*"
      ]
    }
  ]
}
```

6. Name the policy `s3-neurocorp-deploy` → click **Create policy**
7. Back on the user creation page, search for and attach `s3-neurocorp-deploy` → click **Create user**

### 5. Generate Access Keys

1. Go to **IAM → Users → `github-actions-neurocorp-deploy`**
2. Click the **Security credentials** tab
3. Under **Access keys**, click **Create access key**
4. Select **Third-party service** as the use case → click **Next**
5. (Optional) Add a description tag → click **Create access key**
6. **Copy both values immediately** — the Secret Access Key is only shown once

---

## Option B: AWS CLI

### 1. Create the S3 Bucket

```bash
aws s3 mb s3://neurocorp --region us-east-2
```

### 2. Enable Static Website Hosting

```bash
aws s3 website s3://neurocorp \
  --index-document index.html \
  --error-document index.html
```

### 3. Set Bucket Policy for Public Access

```bash
aws s3api put-public-access-block \
  --bucket neurocorp \
  --public-access-block-configuration \
    BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

```bash
aws s3api put-bucket-policy --bucket neurocorp --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::neurocorp/*"
    }
  ]
}'
```

### 4. Create IAM User and Generate Access Keys

```bash
# Create the user
aws iam create-user --user-name github-actions-neurocorp-deploy

# Create and attach the policy
aws iam put-user-policy \
  --user-name github-actions-neurocorp-deploy \
  --policy-name s3-neurocorp-deploy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
        "Resource": ["arn:aws:s3:::neurocorp", "arn:aws:s3:::neurocorp/*"]
      }
    ]
  }'

# Generate access keys
aws iam create-access-key --user-name github-actions-neurocorp-deploy
```

The output will include `AccessKeyId` and `SecretAccessKey`. Save these immediately — the secret is only shown once.

---

## Add Credentials to GitHub Secrets

In your repo: **Settings → Secrets and variables → Actions**, update:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | The Access Key ID from above |
| `AWS_SECRET_ACCESS_KEY` | The Secret Access Key from above |
| `AWS_REGION` | `us-east-2` (already set) |

## Access the Site

Once deployed, the SPA will be available at:

```
http://neurocorp.s3-website-us-east-2.amazonaws.com
```
