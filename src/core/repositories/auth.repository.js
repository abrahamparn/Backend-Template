/**
 * Creates a authentication repository with methods to interact with the User model in the database.
 * Primarily for authentcation purposes
 * @param {{ prisma: import('@prisma/client').PrismaClient }}
 * @returns {object} The user repository object.
 */

export function makeAuthRepository({ prisma }) {
  return {
    /**
     * Finds a user by their uniq ID
     * @param {string} id - The ID of the user
     * @returns {Promise<object|null>}  The user object or null if not found.
     *
     * @remarks
     * **Note:** This method returns *all* columns (including `password_hash`).
     */
    async findById(id) {
      return prisma.user.findUnique({
        where: { id },
      });
    },
  };
}
