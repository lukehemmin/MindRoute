import React from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>MindRoute - AI API 게이트웨이</title>
        <meta name="description" content="여러 AI 제공업체를 위한 통합 API 게이트웨이" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
          MindRoute에 오신 것을 환영합니다
        </h1>

        <p className="description">
          OpenAI, Anthropic, Google AI를 위한 통합 API 게이트웨이
        </p>

        <div className="grid">
          <div className="card">
            <h2>다중 제공업체 지원</h2>
            <p>OpenAI, Anthropic(Claude), Google AI(Gemini)를 단일 API를 통해 사용할 수 있습니다.</p>
          </div>

          <div className="card">
            <h2>편리한 관리</h2>
            <p>웹 인터페이스를 통해 API 키와 설정을 쉽게 관리할 수 있습니다.</p>
          </div>

          <div className="card">
            <h2>사용량 추적</h2>
            <p>모든 API 호출을 기록하고 리포트와 인사이트를 확인할 수 있습니다.</p>
          </div>

          <div className="card">
            <h2>AI 모델 테스트</h2>
            <p>웹 기반 Playground를 통해 다양한 AI 모델을 테스트할 수 있습니다.</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        MindRoute - 개발 중인 프로젝트
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .footer {
          width: 100%;
          height: 50px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
        }

        .description {
          text-align: center;
          line-height: 1.5;
          font-size: 1.5rem;
          margin: 1rem 0;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
          width: 45%;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h2 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style global jsx>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
} 