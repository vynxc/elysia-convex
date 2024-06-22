# `elysia-convex`

`elysia-convex` is a package that integrates Elysia and Convex to create seamless routing and request handling for your applications.

## Installation

To install the package, use npm or yarn:

```sh
npm install elysia-convex
# or
yarn add elysia-convex
```

## Usage

### Basic Example

Here's a simple example demonstrating how to use `elysia-convex` in your project:

```typescript
import { convex, Elysia, HttpRouterWithElysia } from 'elysia-convex';
import { ActionCtx } from './_generated/server';
import { swagger } from '@elysiajs/swagger';
import { api } from './_generated/api';
import { cors } from '@elysiajs/cors';

export const api_controller = new Elysia({ prefix: '/api' })
	.use(convex<ActionCtx>())
	.get('/convex', async (c) => {
		const res: string = await c.ctx.runAction(api.tasks.hello);
		console.log(res, 'convex is cool');
		return res;
	});

export const elysia = new Elysia()
	.use(swagger())
	.use(cors())
	.use(convex<ActionCtx>())
	.get('/', (c) => 'Hello World!')
	.use(api_controller);

export default new HttpRouterWithElysia(elysia);
```
