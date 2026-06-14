import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const expectedTables = [
  "users",
  "roles",
  "permissions",
  "user_roles",
  "role_permissions",
  "companies",
  "projects",
  "suppliers",
  "intervenants",
  "commitments",
  "payments",
  "expense_categories",
  "expenses",
];

const expectedConstraints = [
  "chk_projects_expected_end_date",
  "chk_projects_actual_end_date",
  "chk_projects_ownership_data",
  "chk_commitments_positive_amount",
  "chk_commitments_beneficiary_data",
  "chk_payments_positive_amount",
  "chk_payments_cheque_number",
  "chk_payments_beneficiary_data",
  "chk_expenses_positive_amount",
  "trg_validate_payment_commitment_consistency",
];

type NameRow = { name: string };

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const tableRows = await prisma.$queryRaw<NameRow[]>`
    SELECT table_name AS name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;
  const tables = new Set(tableRows.map((row) => row.name));

  for (const table of expectedTables) {
    assert(tables.has(table), `Missing table: ${table}`);
  }

  const constraintRows = await prisma.$queryRaw<NameRow[]>`
    SELECT conname AS name
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
  `;
  const triggerRows = await prisma.$queryRaw<NameRow[]>`
    SELECT tgname AS name
    FROM pg_trigger
    WHERE NOT tgisinternal
  `;
  const integrityObjects = new Set([
    ...constraintRows.map((row) => row.name),
    ...triggerRows.map((row) => row.name),
  ]);

  for (const constraint of expectedConstraints) {
    assert(integrityObjects.has(constraint), `Missing integrity object: ${constraint}`);
  }

  const [roleCount, permissionCount, rolePermissionCount, expenseCategoryCount, adminCount] = await Promise.all([
    prisma.role.count({ where: { deletedAt: null } }),
    prisma.permission.count({ where: { deletedAt: null } }),
    prisma.rolePermission.count({ where: { deletedAt: null } }),
    prisma.expenseCategory.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: {
        email: (process.env.DEFAULT_ADMIN_EMAIL ?? "admin@btp-manager.local").toLowerCase(),
        deletedAt: null,
        status: "ACTIVE",
      },
    }),
  ]);

  assert(roleCount === 4, `Expected 4 roles, found ${roleCount}`);
  assert(permissionCount === 37, `Expected 37 permissions, found ${permissionCount}`);
  assert(rolePermissionCount > permissionCount, "Expected role-permission mappings to be seeded");
  assert(expenseCategoryCount === 13, `Expected 13 expense categories, found ${expenseCategoryCount}`);
  assert(adminCount === 1, `Expected 1 default admin user, found ${adminCount}`);

  console.log("Database integrity verified", {
    tables: expectedTables.length,
    constraintsAndTriggers: expectedConstraints.length,
    roles: roleCount,
    permissions: permissionCount,
    rolePermissions: rolePermissionCount,
    expenseCategories: expenseCategoryCount,
    defaultAdminUsers: adminCount,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
