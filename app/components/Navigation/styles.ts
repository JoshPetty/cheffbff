"use client";

import styled from "styled-components";

export const Container = styled.nav`
  position: fixed;
  width: 100%;
  background: linear-gradient(135deg, #f8fdf2 0%, #f0fdf9 50%, #f0fbfd 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #f3f4f6;
  z-index: 50;

  .logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
  z-index: 51;
  padding: 0.5rem 1rem 0.5rem 0.5rem;
  border-radius: 1rem;
  
  &:hover {
    background: rgba(134, 197, 64, 0.05);
    transform: translateX(2px);
  }

  img {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
  }

  &:hover img {
    box-shadow: 0 6px 16px rgba(134, 197, 64, 0.3);
    transform: rotate(-5deg);
  }

  span {
    font-size: 1.75rem;
    font-weight: 800;
    background: linear-gradient(135deg, #86C540, #5DC2D1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

    span {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }
  }

  .desktop-nav {
    display: flex;
    align-items: center;
    gap: 2rem;

    a {
      font-weight: 500;
      color: #4b5563;
      transition: color 0.3s;

      &:hover {
        color: #86C540;
      }

      &.active {
        color: #86C540;
        border-bottom: 2px solid #86C540;
        padding-bottom: 0.25rem;
      }

      &.button {
        padding: 0.5rem 1.5rem;
        background: linear-gradient(135deg, #86C540, #5DC2D1);
        color: white;
        border-radius: 0.375rem;
        border-bottom: none;
        margin-right: 0.5rem;

        &:hover {
          background: linear-gradient(135deg, #76B530, #4DB2C1);
          color: white;
        }
      }
    }

    @media (max-width: 768px) {
      display: none;
    }
  }

  .auth-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    @media (max-width: 768px) {
      display: none;
    }
  }

  .menu {
    display: none;
    width: 2.5rem;
    height: 2.5rem;
    position: relative;
    cursor: pointer;
    z-index: 51;

    @media (max-width: 768px) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.375rem;
    }

    &::before,
    &::after,
    span {
      content: '';
      position: absolute;
      width: 1.5rem;
      height: 0.125rem;
      background: #111827;
      transition: all 0.3s;
    }

    &::before {
      top: 0.625rem;
    }

    span {
      top: 50%;
      transform: translateY(-50%);
    }

    &::after {
      bottom: 0.625rem;
    }

    &.active {
      &::before {
        transform: rotate(45deg);
        top: 50%;
        background: #86C540;
      }

      span {
        opacity: 0;
      }

      &::after {
        transform: rotate(-45deg);
        bottom: 50%;
        background: #86C540;
      }
    }
  }

  .mobile-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: white;
    z-index: 40;

    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mobile-menu {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;

      a {
        font-size: 1.5rem;
        font-weight: 600;
        color: #4b5563;
        transition: color 0.3s;

        &:hover {
          color: #86C540;
        }

        &.button {
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #86C540, #5DC2D1);
          color: white;
          border-radius: 0.375rem;
          font-size: 1.25rem;
        }
      }
    }
  }
`;