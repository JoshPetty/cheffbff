"use client";

import styled from "styled-components";

export const Container = styled.section`
  padding: 8rem 2rem 6rem;
  background: linear-gradient(135deg, #f8fdf2 0%, #f0fdf9 50%, #f0fbfd 100%);

  .hero-content {
    max-width: 56rem;
    margin: 0 auto;
    text-align: center;
    
  }

  h1 {
    font-size: 4rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1.5rem;
    line-height: 1.1;
    letter-spacing: -0.02em;

    @media (max-width: 768px) {
      font-size: 3rem;
    }

    .gradient-text {
      background: linear-gradient(135deg, #86C540, #5DC2D1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  p {
    font-size: 1.25rem;
    color: #4b5563;
    margin-bottom: 2.5rem;
    line-height: 1.75;
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;
  }

  .cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;

    @media (max-width: 640px) {
      flex-direction: column;
      align-items: center;
    }
  }

  .primary-button {
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, #86C540, #5DC2D1);
    color: white;
    font-weight: 500;
    border-radius: 0.375rem;
    transition: all 0.3s;
    box-shadow: 0 4px 6px rgba(134, 197, 64, 0.2);

    &:hover {
      background: linear-gradient(135deg, #76B530, #4DB2C1);
      box-shadow: 0 6px 12px rgba(134, 197, 64, 0.3);
      transform: translateY(-2px);
    }
  }

  .secondary-button {
    padding: 0.75rem 2rem;
    border: 2px solid #86C540;
    color: #86C540;
    font-weight: 500;
    border-radius: 0.375rem;
    transition: all 0.3s;

    &:hover {
      background: #86C540;
      color: white;
      transform: translateY(-2px);
    }
  }
`;