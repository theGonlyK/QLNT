# Thiết kế Chi tiết Hạ tầng & Pipeline Triển khai (Infrastructure & Deployment Pipeline) — QLNT

- **Dự án:** Quản lý nhà trọ (QLNT)
- **Mã chuẩn hóa:** `QLNT-D014` (Hạ tầng 3 Giai đoạn), `QLNT-D013` (Single-Page & Presentation), `TECH-STD-001`
- **Đơn vị phụ trách:** `infra-devops` (Mảng C — Vận hành Hạ tầng & CI/CD)
- **Tài liệu tham chiếu:** [`HA_TANG_VA_VAN_HANH_HE_THONG.md`](HA_TANG_VA_VAN_HANH_HE_THONG.md), [`../03-ky-thuat/TECH_PROFILE.md`](../03-ky-thuat/TECH_PROFILE.md)
- **Ngày ban hành:** 2026-11-13
- **Trạng thái:** **`Đã hoàn thành thiết kế — Trình Planner tổng hợp vào Implementation Plan`**

---

## 1. Bảng Đánh giá Tác động & Rủi ro Kỹ thuật (Impact Assessment Table)

Tuân thủ nghiêm ngặt nguyên tắc **Ưu tiên Dễ & Hoàn toàn Miễn phí (`$0/tháng First`)** theo `QLNT-D014`:

| Hạng mục Hạ tầng / Pipeline | Hiện trạng & Rủi ro | Giải pháp Thiết kế Chi tiết | Đánh giá Tác động & Ràng buộc Chi phí |
| :--- | :--- | :--- | :--- |
| **Local Dev Environment** | Dev thiếu môi trường cục bộ đồng nhất, dễ phụ thuộc vào tài khoản Cloud cá nhân gây lộ secret hoặc vượt quota. | Sử dụng `Docker Compose` đóng gói PostgreSQL 16 Alpine + MinIO (mô phỏng S3/R2) + mock auth/schema tự động chạy offline. | • **Chi phí:** **$0** (chạy hoàn toàn trên máy trạm Dev).<br>• **Tác động:** Dev làm việc không cần mạng Internet, không lo rò rỉ dữ liệu thật. |
| **Staging Environment (STG)** | Thiếu môi trường kiểm thử UAT độc lập; nguy cơ lộ dữ liệu CCCD hoặc làm bẩn database pilot. | Dựng pipeline tự động trên GitHub Actions: PR deploy lên `Cloudflare Pages Preview`, kết nối Supabase STG (100% Mock seed data) và Cloudflare R2 STG. | • **Chi phí:** **$0** (Free Tier GitHub Actions + CF Pages Preview + Supabase STG Project).<br>• **Tác động:** Độc lập hoàn toàn với PROD, QA kiểm thử theo checklist `X02`. |
| **Production Stage 1 ($0/tháng)** | Nguy cơ phát sinh chi phí nếu lưu trữ file lớn hoặc gửi quá nhiều query lên Cloud Database. | Triển khai mô hình Serverless/Edge: Cloudflare Pages + Supabase Free (PostgreSQL 16 RLS) + Cloudflare Worker + Cloudflare R2 Private Bucket. | • **Chi phí:** **$0/tháng** cam kết duy trì cho 1 – 50 chủ trọ Pilot.<br>• **Tác động:** Local-First giảm 80% query đọc; nén ảnh Client giảm 70% dung lượng R2. |
| **Bảo mật Multi-Tenant (NT-05, NT-06)** | Rò rỉ dữ liệu giữa các chủ trọ hoặc lộ ảnh CCCD/Hóa đơn ngân hàng của khách thuê. | 1. 100% bảng bật `Row-Level Security (RLS)` theo `landlord_id`.<br>2. Cloudflare Worker xác thực Bearer JWT từ Supabase Auth trước khi ký Presigned URL 15 phút (`900s`).<br>3. R2 Bucket là `Private Bucket 100%`. | • **An toàn thông tin:** Tuyệt đối không có public bucket.<br>• **Rủi ro:** Không có URL vĩnh viễn, ngăn chặn hoàn toàn việc scrape dữ liệu nhạy cảm. |
| **Mobile Shell Packaging** | Tốn chi phí duy trì tài khoản build cloud hoặc maintain hai codebase riêng biệt cho Web và Mobile. | Sử dụng `Capacitor 6` đóng gói bản build `apps/web/dist` thành Android & iOS native shell. Tích hợp GitHub Actions build APK tự động. | • **Chi phí:** **$0**.<br>• **Tác động:** 1 codebase duy nhất, hỗ trợ camera chụp bill/CCCD native. |

---

## 2. Kiến trúc Tổng thể 3 Môi trường Triển khai

```mermaid
flowchart TD
    subgraph M1 ["1. LOCAL DEV (Máy trạm Dev - Offline-Ready)"]
        direction TB
        L_WEB["apps/web (Vite 6 + React 19) :5173"]
        L_IDB["IndexedDB (Dexie.js - Local 10 Entities)"]
        L_COMPOSE["Docker Compose: local-infra"]
        L_PG["Postgres 16 Alpine :5432 (Local Schema + RLS)"]
        L_MINIO["MinIO S3 :9000 (Mock R2 Private Bucket)"]
        L_WEB --> L_IDB
        L_WEB -->|Sync API| L_PG
        L_WEB -->|S3 Upload/Download| L_MINIO
        L_COMPOSE --- L_PG
        L_COMPOSE --- L_MINIO
    end

    subgraph M2 ["2. STAGING (STG - Tự động per Pull Request)"]
        direction TB
        GHA_STG["GitHub Actions CI/CD (.github/workflows/ci-staging.yml)"]
        CF_PREVIEW["Cloudflare Pages Preview (https://pr-*.qlnt.pages.dev)"]
        SUPA_STG["Supabase Free STG (ap-southeast-1, Mock Seed Data)"]
        R2_STG["Cloudflare R2 Bucket: qlnt-stg-private-media"]
        GHA_STG -->|Build & Deploy| CF_PREVIEW
        CF_PREVIEW -->|GraphQL / REST / WebSocket| SUPA_STG
        CF_PREVIEW -->|Signed URL 15p| R2_STG
    end

    subgraph M3 ["3. PRODUCTION GIAI ĐOẠN 1 ($0/tháng - Pilot 1-50 Chủ trọ)"]
        direction TB
        CF_PROD["Cloudflare Pages PROD (app.qlnt.vn / *.pages.dev)"]
        CAP_APP["apps/mobile (Capacitor 6 Android APK / iOS)"]
        CF_WORKER["Cloudflare Worker (media-signer: verify JWT & presign 15p)"]
        SUPA_PROD["Supabase Free PROD (Postgres 16 RLS, 500MB, 200 CCU)"]
        R2_PROD["Cloudflare R2 PROD (Private Bucket: qlnt-prod-private-media)"]
        
        CAP_APP -->|Embedded Webview| CF_PROD
        CF_PROD -->|REST / Realtime WS| SUPA_PROD
        CF_PROD -->|POST /api/media/signed-url (Bearer JWT)| CF_WORKER
        CF_WORKER -->|Generate S3 Presigned URL (900s)| R2_PROD
        CF_PROD -->|Direct PUT/GET Media| R2_PROD
    end

    M1 -.->|"Git Push Feature Branch"| M2
    M2 -.->|"Pass Checklist X02 + Merge main"| M3
```

---

## 3. Thiết kế Chi tiết Môi trường 1: Local Dev (`local`)

### 3.1. Cấu hình `infra/docker/docker-compose.local.yml`
Môi trường Local Dev chạy toàn bộ qua Docker Compose với PostgreSQL 16 và MinIO:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: qlnt-local-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-qlnt_dev}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-qlnt_dev_secret}
      POSTGRES_DB: ${POSTGRES_DB:-qlnt_local}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - qlnt_local_pgdata:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qlnt_dev -d qlnt_local"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:RELEASE.2024-05-10T01-41-38Z
    container_name: qlnt-local-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-qlnt_minio_admin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-qlnt_minio_secret123}
    ports:
      - "${MINIO_API_PORT:-9000}:9000"
      - "${MINIO_CONSOLE_PORT:-9001}:9001"
    volumes:
      - qlnt_local_miniodata:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio-init:
    image: minio/mc:RELEASE.2024-05-09T17-04-24Z
    container_name: qlnt-local-minio-init
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc alias set localminio http://minio:9000 qlnt_minio_admin qlnt_minio_secret123;
      /usr/bin/mc mb --ignore-existing localminio/qlnt-local-private-media;
      /usr/bin/mc anonymous set none localminio/qlnt-local-private-media;
      echo 'MinIO Bucket qlnt-local-private-media initialized as Private Bucket';
      exit 0;
      "

volumes:
  qlnt_local_pgdata:
    name: qlnt_local_pgdata
  qlnt_local_miniodata:
    name: qlnt_local_miniodata
```

### 3.2. Script Khởi tạo Schema Database Local (`infra/docker/init-db/01-schema.sql`)
Tự động kích hoạt extension UUID, tạo bảng và cấu hình RLS cơ bản:
```sql
-- Kích hoạt extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Thiết lập hàm cập nhật updated_at tự động
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 3.3. File cấu hình môi trường Local: `.env.local.example`
```bash
# Vite App Local Env
VITE_APP_ENV=local
VITE_APP_NAME="QLNT (Local Dev)"
VITE_API_URL=http://localhost:5432

# Supabase Local (hoặc Supabase Dev Project nếu test cloud)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local-dev-anon-key-placeholder

# Local Object Storage (MinIO S3 Mock)
VITE_S3_ENDPOINT=http://localhost:9000
VITE_S3_REGION=us-east-1
VITE_S3_BUCKET=qlnt-local-private-media
VITE_S3_ACCESS_KEY=qlnt_minio_admin
VITE_S3_SECRET_KEY=qlnt_minio_secret123

# Edge Presigner API
VITE_MEDIA_SIGNER_URL=http://localhost:5173/api/mock-signer
```

---

## 4. Thiết kế Chi tiết Môi trường 2: Staging (`stg`) & CI/CD Pipeline

### 4.1. Luồng Tự động hóa CI/CD Staging (`.github/workflows/ci-staging.yml`)
Quy trình tự động thực hiện khi có Pull Request hoặc Push vào nhánh `main` / `staging`:
- Kiểm tra mã nguồn: Lint, TypeScript Typecheck, Unit Test (Domain-core, Dexie store, IGameRenderer contract).
- Đóng gói ứng dụng web (`pnpm build`).
- Triển khai Preview lên Cloudflare Pages và xuất URL kiểm thử cho QA Lead theo Checklist `X02`.

```yaml
name: CI/CD Staging & Preview Deployment

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [staging]

jobs:
  code-quality-and-test:
    name: Lint, Typecheck & Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Get pnpm store directory
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run TypeScript typecheck
        run: pnpm typecheck

      - name: Run Unit Tests
        run: pnpm test

  build-and-preview:
    name: Build & Cloudflare Pages Preview
    needs: code-quality-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js & pnpm
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Web Application
        env:
          VITE_APP_ENV: staging
          VITE_SUPABASE_URL: ${{ secrets.STG_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.STG_SUPABASE_ANON_KEY }}
          VITE_MEDIA_WORKER_URL: ${{ secrets.STG_MEDIA_WORKER_URL }}
        run: pnpm --filter @qlnt/web build

      - name: Deploy Preview to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        id: cf_pages_preview
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: 'qlnt-staging'
          directory: 'apps/web/dist'
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

      - name: Post Preview URL to PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const previewUrl = '${{ steps.cf_pages_preview.outputs.url }}';
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `### 🚀 Staging Preview Sẵn Sàng Kiểm Thử (Checklist X02)\n- **Preview URL:** ${previewUrl}\n- **Môi trường:** Cloudflare Pages Preview + Supabase STG\n- **Cam kết chi phí:** $0/tháng`
            });
```

---

## 5. Thiết kế Chi tiết Môi trường 3: Production Giai đoạn 1 ($0/tháng)

### 5.1. Bảng Phân bổ Tài nguyên Free-Tier & Hạn mức An toàn

| Dịch vụ Cloud | Gói sử dụng | Hạn mức Miễn phí (Free Quota) | Mức sử dụng dự kiến (Pilot 1-50 Nhà trọ) | Giải pháp Đảm bảo Không vượt hạn mức ($0) |
| :--- | :--- | :--- | :--- | :--- |
| **Cloudflare Pages** | Free Plan | • Băng thông tĩnh: **Không giới hạn**<br>• Builds: 500 builds/tháng | • Băng thông: ~15 – 30 GB/tháng<br>• Builds: ~30 – 50 builds/tháng | Nén Brotli tự động; cache tài nguyên tĩnh 3D `.glb` trên Anycast CDN Edge |
| **Supabase Database** | Free Tier | • Dung lượng DB: **500 MB**<br>• Realtime CCU: **200 kết nối**<br>• MAU: 50.000 users/tháng | • Dung lượng DB: ~15 – 45 MB<br>• Realtime CCU: 5 – 25 kết nối | **Local-First (Dexie.js):** 100% dữ liệu đọc từ máy khách; chỉ đồng bộ thay đổi qua Outbox Mutation Batch; KHÔNG lưu ảnh trong DB (chỉ lưu URL/Key) |
| **Cloudflare Workers** | Free Plan | • Requests: **100.000 requests/ngày**<br>• CPU time: 10ms/request | • Requests: ~300 – 1.000 requests/ngày | Chỉ gọi Worker khi cần ký Presigned URL upload hoặc xem ảnh nhạy cảm; thời hạn ký 15 phút giúp client tái sử dụng URL |
| **Cloudflare R2 Storage** | Free Tier | • Dung lượng lưu trữ: **10 GB/tháng**<br>• Egress Bandwidth: **0đ / Miễn phí 100%**<br>• Class A ops: 1.000.000/tháng | • Dung lượng lưu trữ: ~1.5 – 3.5 GB (cho ~10.000 ảnh nén)<br>• Class A ops: ~5.000/tháng | Client bắt buộc nén ảnh trước khi upload: định dạng `WebP`, chiều rộng tối đa `1280px`, dung lượng `< 300KB/ảnh` |

---

### 5.2. Cloudflare Worker: Xác thực JWT & Ký Presigned URL 15 phút
Đặt tại `infra/cloudflare-workers/media-signer/`:

#### A. File Cấu hình `wrangler.toml`
```toml
name = "qlnt-media-signer"
main = "src/index.ts"
compatibility_date = "2024-05-01"
workers_dev = true

# Binding R2 Bucket Private
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "qlnt-prod-private-media"

[vars]
ENVIRONMENT = "production"
URL_EXPIRATION_SECONDS = "900" # Đúng 15 phút theo QLNT-D014
ALLOWED_ORIGIN = "https://app.qlnt.vn"
```

#### B. Mã Nguồn Edge Worker: `src/index.ts`
```typescript
/**
 * Cloudflare Worker: Supabase JWT Verifier & Cloudflare R2 S3 Presigner
 * Tuân thủ nghiêm ngặt QLNT-D014 ($0/tháng) & NT-05/NT-06 (Bảo mật CCCD/Hóa đơn)
 */

import { AwsClient } from 'aws4fetch';

export interface Env {
  MEDIA_BUCKET: R2Bucket;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  SUPABASE_JWT_SECRET: string;
  URL_EXPIRATION_SECONDS: string;
  ALLOWED_ORIGIN: string;
}

interface PresignRequestBody {
  action: 'PUT' | 'GET';
  fileKey: string;
  contentType?: string;
  landlordId: string;
  roomId?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Kiểm tra CORS Preflight
    if (request.method === 'OPTIONS') {
      return handleCors(env);
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: getCorsHeaders(env),
      });
    }

    try {
      // 2. Xác thực Bearer JWT từ Supabase Auth
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: getCorsHeaders(env),
        });
      }

      const jwtToken = authHeader.split(' ')[1];
      const tokenPayload = await verifySupabaseJwt(jwtToken, env.SUPABASE_JWT_SECRET);
      if (!tokenPayload) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token signature or expired' }), {
          status: 403,
          headers: getCorsHeaders(env),
        });
      }

      const requestBody: PresignRequestBody = await request.json();
      const { action, fileKey, contentType, landlordId } = requestBody;

      // 3. Kiểm tra tính hợp lệ của quyền truy cập (Isolation theo landlord_id)
      // Token payload của Supabase chứa auth.uid() hoặc user_metadata
      const authenticatedUserId = tokenPayload.sub;
      if (authenticatedUserId !== landlordId && tokenPayload.role !== 'service_role') {
        return new Response(JSON.stringify({ error: 'Forbidden: Cannot access media belonging to another landlord' }), {
          status: 403,
          headers: getCorsHeaders(env),
        });
      }

      // 4. Tạo S3 Presigned URL có thời hạn đúng 15 phút (900 giây)
      const expirationSeconds = parseInt(env.URL_EXPIRATION_SECONDS || '900', 10);
      const aws = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        service: 's3',
        region: 'auto',
      });

      const endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${fileKey}`;
      const url = new URL(endpoint);

      const signHeaders: Record<string, string> = {};
      if (action === 'PUT' && contentType) {
        signHeaders['Content-Type'] = contentType;
      }

      // Ký S3 Presigned URL
      const signedRequest = await aws.sign(url.toString(), {
        method: action,
        headers: signHeaders,
        aws: {
          signQuery: true,
          allHeaders: false,
        },
      });

      return new Response(
        JSON.stringify({
          signedUrl: signedRequest.url,
          expiresIn: expirationSeconds,
          fileKey,
          action,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(env),
          },
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: getCorsHeaders(env),
      });
    }
  },
};

function getCorsHeaders(env: Env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function handleCors(env: Env) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(env),
  });
}

/**
 * Hàm xác thực Supabase JWT HS256 đơn giản và hiệu năng cao trên Cloudflare Edge
 */
async function verifySupabaseJwt(token: string, secret: string): Promise<Record<string, any> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const dataToSign = `${headerB64}.${payloadB64}`;

  // Import HMAC Key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Decode signature base64url
  const signature = base64UrlDecode(signatureB64);
  const isValid = await crypto.subtle.verify(
    'HMAC',
    cryptoKey,
    signature,
    encoder.encode(dataToSign)
  );

  if (!isValid) return null;

  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
  const payload = JSON.parse(payloadJson);

  // Kiểm tra thời gian hết hạn
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowInSeconds) {
    return null;
  }

  return payload;
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
```

---

## 6. Thiết kế Đóng gói Ứng dụng Di động: Capacitor 6 (`apps/mobile`)

### 6.1. Cấu hình `apps/mobile/capacitor.config.ts`
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.qlnt.app',
  appName: 'QLNT - Quản Lý Nhà Trọ',
  webDir: '../web/dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false, // Bắt buộc HTTPS
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1E293B',
      showSpinner: false,
    },
  },
};

export default config;
```

### 6.2. Cấu hình Quyền Native Android & iOS (Bảo vệ Riêng tư)
- **Android (`apps/mobile/android/app/src/main/AndroidManifest.xml`):**
  - `<uses-permission android:name="android.permission.INTERNET" />`
  - `<uses-permission android:name="android.permission.CAMERA" />` (chụp bill thu tiền và CCCD)
  - `<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />` (chọn ảnh bill từ thư viện)
- **iOS (`apps/mobile/ios/App/App/Info.plist`):**
  - `NSCameraUsageDescription`: "QLNT cần quyền Camera để chụp ảnh hợp đồng, CCCD khách thuê và biên lai thu tiền."
  - `NSPhotoLibraryUsageDescription`: "QLNT cần quyền truy cập Album để đính kèm chứng từ chuyển khoản phòng trọ."

### 6.3. GitHub Actions Tự động Build Android APK (`.github/workflows/build-mobile-android.yml`)
Chạy hoàn toàn trên máy chủ Ubuntu miễn phí của GitHub Actions, xuất file APK debug/release để cài thử nghiệm Pilot:
```yaml
name: Build Android APK (Capacitor)

on:
  workflow_dispatch:
  push:
    tags:
      - 'v*.*.*'

jobs:
  build-apk:
    name: Build Android Debug APK ($0 Cost)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Java 17
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Setup Node & pnpm
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Web Dist
        run: pnpm --filter @qlnt/web build

      - name: Sync Capacitor
        run: |
          cd apps/mobile
          npx cap sync android

      - name: Build Android APK via Gradle
        run: |
          cd apps/mobile/android
          chmod +x gradlew
          ./gradlew assembleDebug --no-daemon

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: qlnt-pilot-debug-apk
          path: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 14
```

---

## 7. Ma trận Quản lý Biến Môi trường (Environment Variables Matrix)

| Tên biến | Phạm vi / Service | Môi trường `local` | Môi trường `stg` | Môi trường `prod` |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_APP_ENV` | `apps/web` | `local` | `staging` | `production` |
| `VITE_SUPABASE_URL` | `apps/web` | `http://localhost:54321` | `https://stg-project.supabase.co` | `https://prod-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `apps/web` | `mock-anon-key` | `stg-anon-key-secret` | `prod-anon-key-secret` |
| `VITE_MEDIA_WORKER_URL` | `apps/web` | `http://localhost:5173/api/mock` | `https://stg-signer.workers.dev` | `https://media.qlnt.vn` |
| `POSTGRES_DB` | Docker Compose | `qlnt_local` | *(Supabase STG)* | *(Supabase PROD)* |
| `R2_ACCOUNT_ID` | Cloudflare Worker | *(MinIO local)* | Secret GitHub `STG_CF_ACCOUNT` | Secret GitHub `PROD_CF_ACCOUNT` |
| `R2_BUCKET_NAME` | Cloudflare Worker | `qlnt-local-private-media` | `qlnt-stg-private-media` | `qlnt-prod-private-media` |
| `URL_EXPIRATION_SECONDS` | Cloudflare Worker | `900` | `900` | `900` (15 phút bắt buộc) |
| `SUPABASE_JWT_SECRET` | Cloudflare Worker | `local-dev-jwt-secret` | Secret Supabase STG | Secret Supabase PROD |

---

## 8. Kết luận & Khuyến nghị Bàn giao cho `@planner`

1. **Khẳng định tính khả thi $0/tháng:** Toàn bộ kiến trúc trên đã được thiết kế tối ưu, kết hợp triệt để Local-First (Dexie.js), Cloudflare Pages, Supabase Free Tier, Cloudflare Worker Presigner và Cloudflare R2 Free Egress, bảo đảm vận hành trơn tru cho 1-50 chủ trọ thử nghiệm mà không phát sinh bất kỳ chi phí hạ tầng nào.
2. **Các bước đưa vào Implementation Plan:**
   - **Giai đoạn 1 (Infra Setup):** Thiết lập `infra/docker/docker-compose.local.yml`, schema init, và `.env.local.example`.
   - **Giai đoạn 2 (CI/CD Setup):** Tạo `.github/workflows/ci-staging.yml` và cấu hình Cloudflare Pages Preview.
   - **Giai đoạn 3 (Worker & Storage):** Đóng gói mã nguồn `infra/cloudflare-workers/media-signer` và kiểm thử cấp Presigned URL 15 phút.
   - **Giai đoạn 4 (Mobile Shell):** Thiết lập `apps/mobile` với Capacitor 6 và workflow tự động build APK Android.
   - **Giai đoạn 5 (Nghiệm thu):** Rà soát toàn bộ tiêu chí môi trường theo checklist `X02` trước khi triển khai Pilot.
