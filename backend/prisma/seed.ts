import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const permissions = [
  ["dashboard.read", "View executive dashboard"],
  ["companies.read", "View companies"],
  ["companies.create", "Create companies"],
  ["companies.update", "Update companies"],
  ["companies.archive", "Archive companies"],
  ["projects.read", "View projects"],
  ["projects.create", "Create projects"],
  ["projects.update", "Update projects"],
  ["projects.archive", "Archive projects"],
  ["suppliers.read", "View suppliers"],
  ["suppliers.create", "Create suppliers"],
  ["suppliers.update", "Update suppliers"],
  ["suppliers.archive", "Archive suppliers"],
  ["intervenants.read", "View intervenants"],
  ["intervenants.create", "Create intervenants"],
  ["intervenants.update", "Update intervenants"],
  ["intervenants.archive", "Archive intervenants"],
  ["commitments.read", "View commitments"],
  ["commitments.create", "Create commitments"],
  ["commitments.update", "Update commitments"],
  ["commitments.archive", "Archive commitments"],
  ["payments.read", "View payments"],
  ["payments.create", "Record payments"],
  ["payments.update", "Update payments"],
  ["payments.archive", "Archive payments"],
  ["expenses.read", "View expenses"],
  ["expenses.create", "Record expenses"],
  ["expenses.update", "Update expenses"],
  ["expenses.archive", "Archive expenses"],
  ["construction.read", "View construction tracking"],
  ["construction.update", "Update construction progress"],
  ["reports.read", "View reports"],
  ["reports.export", "Export reports"],
  ["admin.users.manage", "Manage users"],
  ["admin.roles.manage", "Manage roles and permissions"],
  ["audit.read", "View audit logs"],
] as const;

const roles = [
  {
    name: "Administrator",
    code: "administrator",
    description: "Full system access",
    permissions: permissions.map(([code]) => code),
  },
  {
    name: "Project Manager",
    code: "project_manager",
    description: "Project and construction tracking access",
    permissions: [
      "dashboard.read",
      "projects.read",
      "projects.create",
      "projects.update",
      "suppliers.read",
      "intervenants.read",
      "commitments.read",
      "payments.read",
      "expenses.read",
      "construction.read",
      "construction.update",
      "reports.read",
    ],
  },
  {
    name: "Accountant",
    code: "accountant",
    description: "Financial operations access",
    permissions: [
      "dashboard.read",
      "projects.read",
      "suppliers.read",
      "suppliers.create",
      "suppliers.update",
      "intervenants.read",
      "commitments.read",
      "commitments.create",
      "commitments.update",
      "payments.read",
      "payments.create",
      "payments.update",
      "expenses.read",
      "expenses.create",
      "expenses.update",
      "reports.read",
      "reports.export",
    ],
  },
  {
    name: "Viewer",
    code: "viewer",
    description: "Read-only application access",
    permissions: [
      "dashboard.read",
      "companies.read",
      "projects.read",
      "suppliers.read",
      "intervenants.read",
      "commitments.read",
      "payments.read",
      "expenses.read",
      "construction.read",
      "reports.read",
    ],
  },
] as const;

const expenseCategories = [
  "Terrain",
  "Études",
  "Gros œuvre",
  "Main d'œuvre",
  "Fer",
  "Béton",
  "Aluminium",
  "Marbre",
  "Ascenseur",
  "Électricité",
  "Plomberie",
  "Taxes",
  "Divers",
];

async function main() {
  for (const [code, description] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { description, deletedAt: null },
      create: { code, description },
    });
  }

  for (const role of roles) {
    const savedRole = await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        deletedAt: null,
      },
      create: {
        name: role.name,
        code: role.code,
        description: role.description,
      },
    });

    for (const permissionCode of role.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: savedRole.id,
            permissionId: permission.id,
          },
        },
        update: { deletedAt: null },
        create: {
          roleId: savedRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: { isActive: true, deletedAt: null },
      create: { name, isActive: true },
    });
  }
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
