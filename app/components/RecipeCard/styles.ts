"use client";

import styled from "styled-components";

export const Container = styled.div`
  .recipe-link {
    display: block;
    transition: transform 0.3s;

    &:hover {
      transform: translateY(-4px);
    }
  }

  .image-container {
    margin-bottom: 1rem;
    overflow: hidden;
    border-radius: 0.5rem;
    background: #f3f4f6;
    aspect-ratio: 4 / 3;
    border: 2px solid transparent;
    transition: border-color 0.3s;

    .recipe-link:hover & {
      border-color: #86C540;
    }
  }

  .recipe-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;

    .recipe-link:hover & {
      transform: scale(1.05);
    }
  }

  .placeholder-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #86C540, #5DC2D1);

    .emoji {
      font-size: 4rem;
      opacity: 0.6;
    }
  }

  .recipe-content {
    .recipe-meta-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .category-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
      background: rgba(134, 197, 64, 0.12);
      color: #4a8f15;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .cook-time {
      font-size: 0.75rem;
      color: #6b7280;
      font-weight: 500;
    }

    .recipe-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
      transition: color 0.3s;

      .recipe-link:hover & {
        color: #86C540;
      }
    }

    .recipe-description {
      color: #4b5563;
      margin-bottom: 0.75rem;
      line-height: 1.625;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .recipe-stats {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .stat-item {
      font-size: 0.8125rem;
      color: #6b7280;
      font-weight: 500;
    }
  }
`;