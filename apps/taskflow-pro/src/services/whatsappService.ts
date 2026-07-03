export const WhatsAppService = {
  async sendReminder(message: string) {
    try {
      const storageStr = localStorage.getItem('taskflowpro-v2-storage');
      if (!storageStr) return;
      
      const parsed = JSON.parse(storageStr);
      const settings = parsed.state?.settings || {};
      const { whatsappEnabled, whatsappPhone1, whatsappApiKey1, whatsappPhone2, whatsappApiKey2 } = settings;

      if (!whatsappEnabled) {
        console.log('WhatsApp notifications not enabled');
        return;
      }

      const recipients = [];
      if (whatsappPhone1 && whatsappApiKey1) {
        recipients.push({ name: 'Usuario Principal', phone: whatsappPhone1, apiKey: whatsappApiKey1 });
      }
      if (whatsappPhone2 && whatsappApiKey2) {
        recipients.push({ name: 'Usuario Secundario', phone: whatsappPhone2, apiKey: whatsappApiKey2 });
      }

      if (recipients.length === 0) {
        console.log('No valid WhatsApp recipients configured');
        return;
      }

      for (const recipient of recipients) {
        const url = `https://api.callmebot.com/whatsapp.php?phone=${recipient.phone}&text=${encodeURIComponent(message)}&apikey=${recipient.apiKey}`;
        
        const response = await fetch(url);
        if (response.ok) {
          console.log(`WhatsApp message sent to ${recipient.name} (${recipient.phone})`);
        } else {
          console.error(`Failed to send WhatsApp message to ${recipient.name}:`, await response.text());
        }
      }
    } catch (error) {
      console.error('Error sending WhatsApp reminder:', error);
    }
  },

  async onTaskCreated(title: string) {
    await this.sendReminder(`✅ *Tarea Creada*: ${title}\n¡No olvides completarla!`);
  },

  async onTaskCompleted(title: string) {
    await this.sendReminder(`🎉 *¡Tarea Completada!* ${title}\n¡Excelente trabajo!`);
  },

  async onTaskDue(title: string, reminderTime: string) {
    await this.sendReminder(`⏰ *¡RECORDATORIO!* La tarea "${title}" vence a las ${reminderTime}.\n¡Es hora de actuar!`);
  }
};
