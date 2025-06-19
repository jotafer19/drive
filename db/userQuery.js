const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createUser(username, email, password) {
  return await prisma.user.create({
    data: {
      username: username,
      email: email.toLowerCase(),
      password: password,
    },
  });
}

async function getUserByEmail(email) {
  return await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });
}

async function getUserById(id) {
  return await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
};
