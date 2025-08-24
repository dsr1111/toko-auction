# 경매 사이트 (Auction Site)

이 프로젝트는 [Next.js](https://nextjs.org)를 기반으로 한 경매 사이트입니다. 사용자들이 아이템에 입찰할 수 있고, 입찰 내역을 확인할 수 있습니다.

## 주요 기능

- **아이템 경매**: 다양한 아이템에 대한 실시간 입찰
- **입찰 내역**: 각 아이템별 입찰 기록 조회
- **실시간 업데이트**: WebSocket을 통한 실시간 입찰 현황 업데이트
- **디스코드 로그인**: 디스코드 계정으로 간편 로그인
- **관리자 기능**: 아이템 관리 및 삭제

## 새로운 기능: 입찰 내역 조회

- 아이템 카드의 입찰하기 버튼과 입찰 내역 버튼을 나란히 배치
- 입찰 내역 버튼 클릭 시 해당 아이템의 모든 입찰 기록을 모달로 표시
- 최고가 입찰자 강조 표시
- 입찰 시간 및 금액 정보 제공

## 실시간 업데이트 설정

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```bash
# Pusher 설정
NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_app_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth 설정
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### Supabase Realtime 활성화

1. Supabase 대시보드에서 프로젝트 설정으로 이동
2. Database > Replication 섹션에서 `items` 테이블의 Realtime을 활성화
3. `INSERT`, `UPDATE`, `DELETE` 이벤트를 모두 활성화

### Pusher 설정

1. [Pusher](https://pusher.com)에서 새 앱 생성
2. 앱 키와 클러스터 정보를 환경 변수에 설정
3. `/api/pusher/trigger` 엔드포인트가 제대로 작동하는지 확인

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 데이터베이스 설정

입찰 내역 기능을 사용하려면 `bid_history` 테이블이 필요합니다. `database-setup.sql` 파일의 SQL 스크립트를 실행하여 테이블을 생성하세요.

```sql
-- Supabase SQL 편집기에서 실행
-- database-setup.sql 파일 내용 참조
```

## 실시간 업데이트 문제 해결

### 문제: 입찰 후 아이템 카드가 실시간으로 업데이트되지 않음

**해결 방법:**
1. 환경 변수가 올바르게 설정되었는지 확인
2. Supabase Realtime이 활성화되었는지 확인
3. Pusher 앱 키와 클러스터가 올바른지 확인
4. 브라우저 콘솔에서 에러 메시지 확인

### 디버깅

브라우저 개발자 도구의 콘솔에서 다음 로그들을 확인할 수 있습니다:
- `Pusher 이벤트 수신`
- `Supabase Realtime 이벤트`
- `입찰 업데이트`
- `총 입찰가 재계산 트리거`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
