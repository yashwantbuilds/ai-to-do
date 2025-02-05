package com.taskmanager.controller;

import com.taskmanager.model.ChatMessage;
import com.taskmanager.model.Task;
import com.taskmanager.repository.ChatMessageRepository;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.service.HuggingFaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/messages")
public class ChatController {
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private HuggingFaceService huggingFaceService;

    @GetMapping
    public List<ChatMessage> getMessages(@PathVariable Long taskId) {
        List<ChatMessage> messages = chatMessageRepository.findAllByTaskId(taskId);
        
        // If this is the first time accessing chat, generate initial guidance
        if (messages.isEmpty()) {
            taskRepository.findById(taskId).ifPresent(task -> {
                // Generate duration-based message
                String durationMessage = generateDurationMessage(task);
                ChatMessage durationResponse = new ChatMessage();
                durationResponse.setTaskId(taskId);
                durationResponse.setContent(durationMessage);
                durationResponse.setRole("assistant");
                chatMessageRepository.save(durationResponse);
                messages.add(durationResponse);

                // Generate task-specific guidance
                String taskGuidance = generateTaskGuidance(task);
                ChatMessage guidanceResponse = new ChatMessage();
                guidanceResponse.setTaskId(taskId);
                guidanceResponse.setContent(taskGuidance);
                guidanceResponse.setRole("assistant");
                chatMessageRepository.save(guidanceResponse);
                messages.add(guidanceResponse);
            });
        }
        
        return messages;
    }

    private String generateDurationMessage(Task task) {
        LocalDateTime now = LocalDateTime.now();
        long daysPassed = ChronoUnit.DAYS.between(task.getCreatedAt(), now);
        
        StringBuilder prompt = new StringBuilder();
        if (daysPassed == 0) {
            prompt.append("This task was created today. Provide a quick, motivating message to get started immediately.");
        } else {
            prompt.append("⏰ This task has been pending for ").append(daysPassed)
                  .append(daysPassed == 1 ? " day" : " days")
                  .append(". Give a crisp reminder about urgency and one immediate action step.");
        }
        
        return huggingFaceService.generateResponse(prompt.toString(), task.getId());
    }

    private String generateTaskGuidance(Task task) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("For this ").append(task.getPriority().toString()).append(" priority task:\n")
              .append("Title: ").append(task.getTitle()).append("\n")
              .append("Description: ").append(task.getDescription()).append("\n\n")
              .append("Provide a concise response with:\n")
              .append("1. One key first step to start\n")
              .append("2. One potential challenge to watch out for\n")
              .append("Keep the response short and actionable.");
        
        return huggingFaceService.generateResponse(prompt.toString(), task.getId());
    }

    @PostMapping
    public ChatMessage createMessage(@PathVariable Long taskId, @RequestBody ChatMessage message) {
        message.setTaskId(taskId);
        message.setRole("user");
        ChatMessage savedMessage = chatMessageRepository.save(message);
        
        // Generate AI response using Hugging Face with conversation history
        String aiResponse = huggingFaceService.generateResponse(message.getContent(), taskId);
        ChatMessage aiMessage = new ChatMessage();
        aiMessage.setTaskId(taskId);
        aiMessage.setContent(aiResponse);
        aiMessage.setRole("assistant");
        chatMessageRepository.save(aiMessage);
        
        return savedMessage;
    }
}