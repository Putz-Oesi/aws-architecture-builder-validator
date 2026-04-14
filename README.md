# AWS Architecture Builder & Validator

An interactive portfolio project built with React, TypeScript, Vite, and React Flow.

This app allows users to visually build AWS architectures, validate common service relationships, and practice typical cloud patterns through guided exercises.

## Overview

The goal of this project is to combine frontend engineering, UX thinking, and cloud architecture fundamentals in one interactive tool.

Instead of only drawing boxes and lines, the app helps users:

- build common AWS architecture patterns visually
- understand whether service relationships make sense
- receive guidance for better paths
- practice architecture basics through structured exercises

## Features

### Visual architecture builder
- Drag and drop AWS services onto the canvas
- Connect services visually
- Remove services and connections directly in the UI
- Use a dedicated service palette above the canvas

### Architecture validation
- Service relationships are checked with a rule-based validation layer
- Connections are classified semantically, for example:
  - request flow
  - data flow
  - event flow
  - review-needed flow
- Problematic connections provide feedback and better-path suggestions

### Guided architecture feedback
- Live architecture guide panel
- Current pattern detection
- Next best step suggestions
- Selected service explanation

### Practice mode
- Random guided exercises grouped by category
- Categories currently include:
  - Build patterns
  - Complete patterns
  - Fix broken architectures
- Exercise pool logic prevents immediate repetition
- Completion feedback is shown directly inside the canvas
- Completed and remaining exercise counts are tracked per category

## Example architecture patterns included

- Static website delivery
- Serverless API
- Web app with database
- Event-driven processing flow
- Fixing broken architecture relationships

## Tech stack

- React
- TypeScript
- Vite
- React Flow
- CSS

## Why I built this

I wanted to create a portfolio project that is more than a standard CRUD application.

This project lets me demonstrate:

- frontend architecture and state handling
- UI and UX decisions
- interactive drag-and-drop behavior
- rule-based validation logic
- practical AWS architecture understanding

It is intended as a practical learning and portfolio project for cloud and frontend-oriented roles.

## Current status

This project is already functional and usable.

Current capabilities include:
- architecture building
- validation feedback
- guided exercises
- category-based random exercise pools
- success detection for required architecture structures

The project is still being improved incrementally, especially around:
- exercise progression
- architecture feedback depth
- validation and learning hints
- additional UX refinements

## Local setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/Putz-Oesi/aws-architecture-builder-validator.git
cd aws-architecture-builder-validator
npm install
npm run dev
