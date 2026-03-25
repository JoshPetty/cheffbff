"use client";

import styled from "styled-components";

export const Container = styled.section`
  padding: 6rem 2rem;
  background: #ffffff;

  .featured-header {
    max-width: 80rem;
    margin: 0 auto 3rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    h2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;

      @media (max-width: 768px) {
        font-size: 2rem;
      }
    }

    p {
      color: #4b5563;
    }

    .view-all {
      color: #86C540;
      font-weight: 600;
      transition: all 0.3s;

      &:hover {
        color: #5DC2D1;
        transform: translateX(4px);
      }
    }
  }

  .recipes-grid {
    max-width: 80rem;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 769px) and (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 1025px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }
`;