# Eloquentify

A JavaScript ORM inspired by Laravel's Eloquent, providing an intuitive and fluent interface for interacting with SQLite databases.

[Read documentation here.](https://github.com/armandkaufmann/eloquentify/wiki)

## Overview

Eloquent JS is a lightweight Object-Relational Mapping (ORM) library that brings Laravel Eloquent's elegant syntax to JavaScript/Node.js. It features a powerful query builder, automatic table name generation, and a simple configuration system.

## Notes: 
- ⚠️ Support for Eloquent-style models is still in active development. 🔨  

## Features

- **Fluent Query Builder**: Build complex SQL queries with an intuitive, chainable API
- **Eloquent-Style Models [IN DEVELOPMENT 🔨 ]**: Define models that automatically map to database tables
- **Automatic Table Naming**: Automatically pluralizes and converts model names to snake_case
- **SQLite Support**: Built-in support for SQLite with both file-based and in-memory databases
- **Flexible Configuration**: JSON-based configuration system
- **Rich Query Methods**: Comprehensive set of query methods including where clauses, joins, grouping, and more

## Installation

```bash
npm install eloquentify
```

## Configuration

Eloquent JS uses a configuration file named `eloquentconfig.json` in your project root. If no configuration file is found, it defaults to an in-memory SQLite database.

### Default Configuration

### Example Configuration

Create an `eloquentconfig.json` file in your project root:

```json
{
  "database": {
    "file": "database.sqlite",
    "relative": true
  },
  "table": {
    "case": "snake"
  }
}
```

**Configuration Options:**
- `database.file`: Path to your SQLite database file or `:memory:` for in-memory database
- `database.relative`: Set to `true` if the database path is relative to your project root
- `table.case`: Naming convention for auto-generated table names (snake, camel, pascal, kebab, etc.)

## Usage

### Defining Models [IN DEVELOPMENT 🔨]

Models automatically infer table names by pluralizing and converting the class name to snake_case:

```javascript
import { Model } from 'eloquentify';

// Automatically uses 'users' table
class User extends Model {}

// Override table name
class Customer extends Model {
  constructor() {
    super({ table: 'customers', primaryKey: 'customer_id' });
  }
}
```

### Basic Model Operations [IN DEVELOPMENT 🔨]

```javascript
// Create a record
await User.create({ name: 'John Doe', email: 'john@example.com' });

// Get all records
const users = await User.all();

// Get first record
const user = await User.first();

// Query with conditions
const user = await new User()
  .where('email', '=', 'john@example.com')
  .first();
```

### Query Builder

The query builder provides a fluent interface for constructing SQL queries:

#### Basic Queries

```javascript
import { Query } from 'eloquentify';

// Simple select
const results = await Query.from('users').get();

// Select specific columns
const results = await Query
  .from('users')
  .select('id', 'name', 'email')
  .get();

// Get first result
const user = await Query
  .from('users')
  .where('id', '=', 1)
  .first();
```

#### Where Clauses

```javascript
// Basic where
Query.from('users')
  .where('age', '>', 18)
  .get();

// Multiple where conditions
Query.from('users')
  .where('status', '=', 'active')
  .where('age', '>=', 18)
  .get();

// Or where
Query.from('users')
  .where('status', '=', 'active')
  .orWhere('role', '=', 'admin')
  .get();

// Where null/not null
Query.from('users')
  .whereNull('deleted_at')
  .get();

// Where in
Query.from('users')
  .whereIn('status', ['active', 'pending'])
  .get();

// Where between
Query.from('users')
  .whereBetween('age', [18, 65])
  .get();
```

#### Joins

```javascript
// Inner join
Query.from('users')
  .join('posts', 'users.id', '=', 'posts.user_id')
  .get();

// Left join
Query.from('users')
  .leftJoin('posts', 'users.id', '=', 'posts.user_id')
  .get();

// Cross join
Query.from('users')
  .crossJoin('roles')
  .get();
```

#### Grouping and Aggregation

```javascript
// Group by
Query.from('orders')
  .select('user_id', 'COUNT(*) as total')
  .groupBy('user_id')
  .get();

// Having clause
Query.from('orders')
  .select('user_id', 'SUM(amount) as total')
  .groupBy('user_id')
  .having('total', '>', 1000)
  .get();
```

#### Ordering and Limiting

```javascript
// Order by
Query.from('users')
  .orderBy('created_at', 'DESC')
  .get();

// Limit and offset
Query.from('users')
  .orderBy('id', 'ASC')
  .limit(10)
  .offset(20)
  .get();
```

#### Conditional Queries

```javascript
// When - conditionally add clauses
const status = 'active';
Query.from('users')
  .when(status, (query, value) => {
    query.where('status', '=', value);
  })
  .get();
```

#### Insert, Update, Delete

```javascript
// Insert
await Query.from('users').insert({
  name: 'John Doe',
  email: 'john@example.com'
});

// Insert and get ID
const id = await Query.from('users').insertGetId({
  name: 'Jane Doe',
  email: 'jane@example.com'
});

// Update
await Query.from('users')
  .where('id', '=', 1)
  .update({ status: 'inactive' });

// Delete
await Query.from('users')
  .where('status', '=', 'banned')
  .delete();
```

#### Raw Queries

```javascript
// Select raw
Query.from('users')
  .selectRaw('COUNT(*) as total, AVG(age) as avg_age')
  .get();

// Where raw
Query.from('users')
  .whereRaw('age > ? AND status = ?', [18, 'active'])
  .get();

// Raw statements
const raw = Query.raw('CURRENT_TIMESTAMP');
```

#### Debugging Queries

Use `toSql()` to see the generated SQL without executing:

```javascript
const sql = await Query.from('users')
  .where('age', '>', 18)
  .toSql()
  .get();

console.log(sql); // "SELECT * FROM `users` WHERE `age` > 18"
```

## Database Connection

The DB class handles database connections automatically, connecting and disconnecting for each query:

## Notes

- This package currently supports SQLite databases only
- Database connections are automatically managed (connect/disconnect per query)
- All queries support both SQL string generation (via `toSql()`) and execution
- The query builder uses prepared statements with parameter binding for security
- Table names are automatically generated from model class names using pluralization and snake_case conversion by default
