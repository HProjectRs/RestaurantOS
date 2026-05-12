# Prisma Migrations

This directory contains all database migration files for RestaurantOS.

## Important Rules

- **Never edit existing migration files** — they represent the exact state of the database schema at a point in time. Create a new migration instead.
- **Always test migrations** on a copy of production data before deploying.
- **Use descriptive names** for migrations so team members understand what changed.

## Migration Commands

### Development

```bash
# Create a new migration after changing schema.prisma
npx prisma migrate dev --name description_of_change

# Example:
npx prisma migrate dev --name "add_loyalty_points_to_customers"
```

This command will:
1. Compare your schema with the current database
2. Generate a new migration SQL file
3. Apply it to your local database
4. Update the Prisma client

### Production

```bash
# Apply pending migrations (safe for production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Migration Strategies

| Command | When to Use | Safety |
|---------|-------------|--------|
| `prisma db push` | Development only, rapid prototyping | ⚠️ May cause data loss |
| `prisma migrate dev` | Local development, creating migrations | ✅ Safe |
| `prisma migrate deploy` | Production/CI deployments | ✅ Safe |
| `prisma migrate resolve` | Fixing migration history issues | ⚠️ Manual intervention |

## Squashing Migrations

Over time, many small migration files accumulate. To clean them up:

```bash
# 1. Back up your database
pg_dump -U postgres restaurantos > backup.sql

# 2. Squash migrations into a single file
npx prisma migrate dev --name squash

# 3. Delete old migration files (keep only the new squashed one)
# Delete all migration directories except the new one
```

⚠️ **Squashing resets the migration history.** All team members will need to run `prisma migrate dev` and you may need to update deployment environments.

## Naming Convention

Always use descriptive kebab-case names:

```
✅ add_loyalty_points_to_customers
✅ create_employee_shifts_table
✅ add_stripe_payment_intent_id
❌ fix_schema
❌ update
❌ new_migration
```

## Deployment Order

When deploying to production:

1. Take a database backup
2. Run `npx prisma migrate deploy`
3. Verify all migrations applied: `npx prisma migrate status`
4. Start the application
5. Verify the app works with the new schema
