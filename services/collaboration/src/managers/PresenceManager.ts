interface UserPresence {
  userId: string;
  name?: string;
  avatar?: string;
  cursor?: { x: number; y: number; z: number };
  selection?: string[];
  lastSeen: number;
}

export class PresenceManager {
  private presence: Map<string, Map<string, UserPresence>> = new Map();

  addUser(projectId: string, userId: string) {
    if (!this.presence.has(projectId)) {
      this.presence.set(projectId, new Map());
    }

    const projectPresence = this.presence.get(projectId)!;
    projectPresence.set(userId, {
      userId,
      lastSeen: Date.now(),
    });
  }

  updateUser(projectId: string, userId: string, data: Partial<UserPresence>) {
    const projectPresence = this.presence.get(projectId);
    if (!projectPresence) return;

    const user = projectPresence.get(userId);
    if (!user) return;

    projectPresence.set(userId, {
      ...user,
      ...data,
      lastSeen: Date.now(),
    });
  }

  removeUser(projectId: string, userId: string) {
    const projectPresence = this.presence.get(projectId);
    if (!projectPresence) return;

    projectPresence.delete(userId);

    if (projectPresence.size === 0) {
      this.presence.delete(projectId);
    }
  }

  getPresence(projectId: string): UserPresence[] {
    const projectPresence = this.presence.get(projectId);
    if (!projectPresence) return [];

    return Array.from(projectPresence.values());
  }

  cleanupStalePresence(maxAge: number = 60000) {
    const now = Date.now();

    this.presence.forEach((projectPresence, projectId) => {
      projectPresence.forEach((user, userId) => {
        if (now - user.lastSeen > maxAge) {
          projectPresence.delete(userId);
        }
      });

      if (projectPresence.size === 0) {
        this.presence.delete(projectId);
      }
    });
  }
}
