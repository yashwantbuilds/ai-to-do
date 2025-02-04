package com.taskmanager.service;

import com.taskmanager.model.ChatMessage;
import com.taskmanager.model.Task;
import com.taskmanager.repository.ChatMessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HuggingFaceService {
    
    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Value("${huggingface.api.url}")
    private String apiUrl;
    
    @Value("${huggingface.api.token}")
    private String apiToken;

    private static final String SYSTEM_PROMPT = 
        "You are TaskPro, an AI assistant with dual expertise:\n\n" +
        "1. Senior Software Engineer:\n" +
        "- Expert in Java, Spring Boot, and AWS\n" +
        "- Proficient in software architecture and design patterns\n" +
        "- Experienced in microservices and cloud-native applications\n" +
        "- Strong knowledge of best practices and performance optimization\n\n" +
        "- A tutor on java, spring boot and aws.\n\n" +
        "2. Task Planning Specialist:\n" +
        "- Break down technical tasks into manageable steps\n" +
        "- Provide implementation guidance and code examples\n" +
        "- Suggest architectural approaches and technical solutions\n" +
        "- Identify technical challenges and mitigation strategies\n" +
        "- Help prioritize development tasks\n\n" +
        "Provide practical, code-focused advice when discussing technical implementation, " +
        "and clear task management guidance for planning. Keep responses concise and actionable.";

    public String generateResponse(String userPrompt, Long taskId) {
        try {
            // Get conversation history for this task
            List<ChatMessage> chatHistory = chatMessageRepository.findAllByTaskId(taskId);
            
            // Build the conversation context
            StringBuilder conversationBuilder = new StringBuilder();
            conversationBuilder.append("System: ").append(SYSTEM_PROMPT).append("\n\n");
            
            // Add chat history
            for (ChatMessage message : chatHistory) {
                String role = message.getRole().equals("assistant") ? "Assistant" : "Human";
                conversationBuilder.append(role).append(": ")
                                 .append(message.getContent())
                                 .append("\n\n");
            }
            
            // Add the current user prompt
            conversationBuilder.append("Human: ").append(userPrompt).append("\n\n");
            conversationBuilder.append("Assistant: Let me help you with task planning. ");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("inputs", conversationBuilder.toString());
            requestBody.put("parameters", Map.of(
                "max_new_tokens", 500, // Increased token limit for context
                "temperature", 0.7,
                "top_p", 0.9,
                "do_sample", true,
                "return_full_text", false
            ));
            
            RequestBody body = RequestBody.create(
                objectMapper.writeValueAsString(requestBody),
                MediaType.parse("application/json")
            );

            Request request = new Request.Builder()
                .url(apiUrl)
                .post(body)
                .addHeader("Authorization", "Bearer " + apiToken)
                .build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new IOException("Unexpected response " + response);
                }
                
                String responseBody = response.body().string();
                return parseResponse(responseBody);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "I apologize, but I'm having trouble accessing my task planning capabilities. " +
                   "Please try asking your question again, and I'll do my best to help.";
        }
    }

    private String parseResponse(String responseBody) {
        try {
            List<?> responses = objectMapper.readValue(responseBody, List.class);
            if (responses != null && !responses.isEmpty()) {
                Map<?, ?> firstResponse = (Map<?, ?>) responses.get(0);
                String generatedText = (String) firstResponse.get("generated_text");
                
                if (generatedText != null && !generatedText.trim().isEmpty()) {
                    // Clean up the response while preserving line breaks
                    String cleaned = generatedText
                        .replaceAll("(?i)Assistant:|Human:|System:", "")
                        .replaceAll("Let me help you with task planning\\.", "")
                        .trim();
                    
                    // Ensure proper line breaks for numbered lists and bullet points
                    cleaned = cleaned
                        .replaceAll("(\\d+\\.|•|\\*|-)\\s", "\n$0 ") // Add line break before numbers and bullets
                        .replaceAll("\n{3,}", "\n\n") // Remove excessive line breaks
                        .trim();
                    
                    if (cleaned.length() < 10) {
                        return "Could you please provide more details about your task? " +
                               "I'm here to help with planning and organization.";
                    }
                    
                    return cleaned;
                }
            }
            return "I'm ready to help you plan and organize your tasks. What would you like assistance with?";
        } catch (Exception e) {
            e.printStackTrace();
            return "I'm here to help with your task management. What specific aspect would you like to discuss?";
        }
    }

    private String generateTaskGuidance(Task task) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("For this ").append(task.getPriority().toString()).append(" priority task:\n")
              .append("Title: ").append(task.getTitle()).append("\n")
              .append("Description: ").append(task.getDescription()).append("\n\n")
              .append("As a senior software engineer and task planner, provide:\n")
              .append("1. Technical approach: Suggest one key technical solution or architecture decision\n")
              .append("2. First implementation step: Specific, actionable technical task to start with\n")
              .append("3. Potential technical challenge: One specific technical consideration to watch out for\n")
              .append("Keep the response technical yet concise, focusing on Java/Spring Boot best practices where applicable.");
        
        return generateResponse(prompt.toString(), task.getId());
    }
} 