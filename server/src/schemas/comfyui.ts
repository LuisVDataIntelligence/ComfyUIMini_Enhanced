import { z } from 'zod';

// Schema for ComfyUI workflow node structure
const WorkflowNodeSchema = z.object({
  class_type: z.string(),
  inputs: z.record(z.unknown()),
  _meta: z.optional(z.object({
    title: z.optional(z.string())
  }))
});

// Schema for ComfyUI workflow structure
const WorkflowSchema = z.record(z.string(), WorkflowNodeSchema);

// Schema for ComfyUI prompt request payload
export const ComfyUIPromptSchema = z.object({
  prompt: WorkflowSchema,
  clientId: z.string().optional().default('comfyuimini'),
  extra_data: z.optional(z.object({
    extra_pnginfo: z.optional(z.object({
      workflow: z.optional(z.unknown())
    }))
  }))
});

export type ComfyUIPromptRequest = z.infer<typeof ComfyUIPromptSchema>;