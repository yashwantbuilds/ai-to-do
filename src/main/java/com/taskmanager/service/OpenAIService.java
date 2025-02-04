package com.taskmanager.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Map;

//@Service
public class OpenAIService {
//    @Value("${openai.api.key}")
    private String apiKey;
    
    private final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private final RestTemplate restTemplate = new RestTemplate();

    public String generateResponse(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = Map.of(
            "model", "gpt-3.5-turbo",
            "messages", new Object[]{
                Map.of(
                    "role", "user",
                    "content", prompt
                )
            }
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(OPENAI_API_URL, request, Map.class);
        
        // Extract the response text from the OpenAI API response
        return extractResponseText(response.getBody());
    }

    private String extractResponseText(Map response) {
        try {
            return ((Map) ((Map) ((java.util.List) response.get("choices")).get(0)).get("message")).get("content").toString();
        } catch (Exception e) {
            return "Error generating response";
        }
    }
} 