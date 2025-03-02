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
            Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

            // Generate task-specific guidance with subtasks context
            String taskGuidance = huggingFaceService.generateTaskGuidance(task);
            ChatMessage guidanceResponse = new ChatMessage();
            guidanceResponse.setTaskId(taskId);
            guidanceResponse.setContent(taskGuidance);
            guidanceResponse.setRole("assistant");
            chatMessageRepository.save(guidanceResponse);
            messages.add(guidanceResponse);
        }
        
        return messages;
    }

    @PostMapping
    public ChatMessage createMessage(@PathVariable Long taskId, @RequestBody ChatMessage message) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
            
        message.setTaskId(taskId);
        message.setRole("user");
        ChatMessage savedMessage = chatMessageRepository.save(message);
        
        // Generate AI response using task context including subtasks
        String aiResponse = huggingFaceService.generateTaskGuidance(task);
        ChatMessage aiMessage = new ChatMessage();
        aiMessage.setTaskId(taskId);
        aiMessage.setContent(aiResponse);
        aiMessage.setRole("assistant");
        chatMessageRepository.save(aiMessage);
        
        return savedMessage;
    }
}