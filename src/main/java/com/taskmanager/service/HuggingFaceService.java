package com.taskmanager.service;

import com.taskmanager.model.ChatMessage;
import com.taskmanager.model.Task;
import com.taskmanager.model.SubTask;
import com.taskmanager.repository.ChatMessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.Set;

@Service
public class HuggingFaceService {
    
    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final okhttp3.MediaType JSON = okhttp3.MediaType.parse("application/json; charset=utf-8");
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Value("${huggingface.api.url}")
    private String apiUrl;
    
    @Value("${huggingface.api.token}")
    private String apiToken;

    private static final String SYSTEM_PROMPT = 
        "You are an AI assistant with dual expertise:\n\n" +
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
        "- Help prioritize development tasks with help of subtasks\n\n" +
        "Provide practical, code-focused advice when discussing technical implementation, " +
        "and clear task management guidance for planning. Keep responses concise and actionable.";

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateResponse(String prompt, Long taskId) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("inputs", prompt);
            
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            RequestBody body = RequestBody.create(jsonBody, JSON);

            Request request = new Request.Builder()
                .url(apiUrl)
                .post(body)
                .addHeader("Authorization", "Bearer " + apiToken)
                .build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new RuntimeException("Unexpected response " + response);
                }
                
                List<Map<String, Object>> responseBody = objectMapper.readValue(
                    response.body().string(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
                );
                
                if (responseBody != null && !responseBody.isEmpty()) {
                    return (String) responseBody.get(0).get("generated_text");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "Error generating response";
    }

    public String generateTaskGuidance(Task task) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("For this ").append(task.getPriority().toString()).append(" priority task:\n")
              .append("Title: ").append(task.getTitle()).append("\n")
              .append("Description: ").append(task.getDescription()).append("\n");
        
        // Add subtasks information
        if (!task.getSubtasks().isEmpty()) {
            prompt.append("\nCurrent Subtasks Status:\n");
            task.getSubtasks().forEach(subtask -> {
                prompt.append("- ")
                      .append(subtask.isCompleted() ? "[✓] " : "[ ] ")
                      .append(subtask.getTitle());
                if (subtask.getCompletedAt() != null) {
                    prompt.append(" (Completed on: ")
                          .append(subtask.getCompletedAt().toLocalDate())
                          .append(")");
                }
                prompt.append("\n");
            });
            
            // Add completion statistics
            long completedCount = task.getSubtasks().stream()
                    .filter(SubTask::isCompleted)
                    .count();
            prompt.append("\nProgress: ")
                  .append(completedCount)
                  .append("/")
                  .append(task.getSubtasks().size())
                  .append(" subtasks completed\n");
        }

        // Add task status and timing information
        prompt.append("\nTask Status: ").append(task.getStatus());
        if (task.getStartedAt() != null) {
            prompt.append("\nStarted: ").append(task.getStartedAt().toLocalDate());
        }
        if (task.getScheduledTime() != null) {
            prompt.append("\nScheduled for: ").append(task.getScheduledTime().toLocalDate());
        }

        prompt.append("\n\nBased on the current status and subtasks, please provide:");
        prompt.append("\n1. Progress assessment and next steps");
        prompt.append("\n2. Suggestions for any missing subtasks");
        prompt.append("\n3. Priority recommendations for incomplete items");
        if (task.getScheduledTime() != null) {
            prompt.append("\n4. Timeline alignment with scheduled date");
        }
        
        return generateResponse(prompt.toString(), task.getId());
    }

    public List<String> generateSubtasks(Task task, String userPrompt) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("For this task:\n")
              .append("Title: ").append(task.getTitle()).append("\n")
              .append("Description: ").append(task.getDescription()).append("\n");
        
        // Add existing subtasks for context
        if (!task.getSubtasks().isEmpty()) {
            prompt.append("\nExisting subtasks:\n");
            task.getSubtasks().forEach(subtask -> {
                prompt.append("- ").append(subtask.getTitle()).append("\n");
            });
        }
        
        prompt.append("\nUser request: ").append(userPrompt).append("\n\n")
              .append("Check first, if its a technical task or a non technical task. ")
              .append("If technical task: You are an expert of SQL, Java, Spring Boot, AWS, and Jooq, use these skills to generate new, unique subtasks that are not duplicates of existing ones. ")
              .append("If non technical task: You are a task planning specialist, use your skills to generate new, unique subtasks that are not duplicates of existing ones. ");

        String response = generateResponse(prompt.toString(), task.getId());
        
        // Parse and filter the response
        Set<String> existingTitles = task.getSubtasks().stream()
            .map(SubTask::getTitle)
            .map(String::toLowerCase)
            .collect(Collectors.toSet());
        
        // Parse, filter, and truncate new subtasks
        return Arrays.stream(response.split("\n"))
            .map(line -> line.replaceAll("^\\d+\\.\\s*|^-\\s*|^•\\s*", "").trim())
            .filter(line -> !line.isEmpty())
            .filter(line -> !existingTitles.contains(line.toLowerCase())) // Filter out duplicates
            .map(line -> line.length() > 200 ? line.substring(0, 197) + "..." : line) // Truncate if too long
            .distinct() // Remove any duplicates from the AI response
            .collect(Collectors.toList());
    }

    public String generateMethodSignature(String problemDescription) {
        if (problemDescription == null || problemDescription.trim().isEmpty()) {
            return "// No problem description provided";
        }

        String prompt = String.format(
            "Given this coding problem description, generate only a Java method signature with appropriate name and parameters. " +
            "Include only the method declaration line with documentation. No implementation. Description: %s",
            problemDescription
        );
        
        try {
            String response = generateResponse(prompt, null);
            // Clean up the response to get just the method signature
            return response.replaceAll("```java\\s*|```\\s*$", "").trim();
        } catch (Exception e) {
            return "// Error generating method signature";
        }
    }

    public String generateImplementation(String methodSignature, String algorithm) {
        String prompt = String.format(
            "You are a Java programming expert. Given this method signature and algorithm, write a complete Java implementation.\n\n" +
            "Method Signature:\n%s\n\n" +
            "Algorithm Steps:\n%s\n\n" +
            "Write only the complete Java method implementation with comments. Include proper error handling and edge cases. " +
            "The code should be production-ready and follow best practices. " +
            "Return only the code without any explanations or markdown.",
            methodSignature,
            algorithm
        );
        
        try {
            String response = generateResponse(prompt, null);
            // Clean up the response to get just the implementation
            return response.replaceAll("```java\\s*|```\\s*$", "").trim();
        } catch (Exception e) {
            return String.format("%s {\n    // Error generating implementation\n}", methodSignature);
        }
    }
} 