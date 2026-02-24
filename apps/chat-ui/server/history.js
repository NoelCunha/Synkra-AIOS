import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_DIR = path.join(__dirname, '../.chat-history');

export class HistoryManager {
  constructor() {
    this.historyDir = HISTORY_DIR;
    this.ensureHistoryDir();
  }

  async ensureHistoryDir() {
    await fs.ensureDir(this.historyDir);
  }

  getConversationPath(conversationId) {
    return path.join(this.historyDir, `${conversationId}.json`);
  }

  async createConversation(conversationId, workingDirectory) {
    const conversationPath = this.getConversationPath(conversationId);

    // Check if already exists
    if (await fs.pathExists(conversationPath)) {
      return await this.getConversation(conversationId);
    }

    const conversation = {
      id: conversationId,
      title: 'Nova Conversa',
      workingDirectory: workingDirectory || process.cwd(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    await fs.writeJson(conversationPath, conversation, { spaces: 2 });
    return conversation;
  }

  async getConversation(conversationId) {
    const conversationPath = this.getConversationPath(conversationId);

    if (!(await fs.pathExists(conversationPath))) {
      return null;
    }

    return await fs.readJson(conversationPath);
  }

  async addMessage(conversationId, message) {
    const conversation = await this.getConversation(conversationId);

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.messages.push({
      id: uuidv4(),
      ...message
    });

    // Update title based on first user message
    if (conversation.title === 'Nova Conversa' && message.role === 'user') {
      conversation.title = this.generateTitle(message.content);
    }

    conversation.updatedAt = new Date().toISOString();

    await fs.writeJson(this.getConversationPath(conversationId), conversation, { spaces: 2 });
    return conversation;
  }

  generateTitle(content) {
    // Generate a short title from the first message
    const maxLength = 50;
    const cleaned = content.replace(/\n/g, ' ').trim();

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    return cleaned.substring(0, maxLength).trim() + '...';
  }

  async listConversations() {
    await this.ensureHistoryDir();

    const files = await fs.readdir(this.historyDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const conversations = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(this.historyDir, file);
        const data = await fs.readJson(filePath);
        return {
          id: data.id,
          title: data.title,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          messageCount: data.messages?.length || 0
        };
      })
    );

    // Sort by updatedAt descending
    return conversations.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async deleteConversation(conversationId) {
    const conversationPath = this.getConversationPath(conversationId);

    if (await fs.pathExists(conversationPath)) {
      await fs.remove(conversationPath);
      return true;
    }

    return false;
  }

  async clearAllConversations() {
    await fs.emptyDir(this.historyDir);
  }
}
