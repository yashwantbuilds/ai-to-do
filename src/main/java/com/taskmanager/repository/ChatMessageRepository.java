package com.taskmanager.repository;

import com.taskmanager.model.ChatMessage;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Repository
public class ChatMessageRepository {
    private final Map<Long, ChatMessage> messages = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong();

    public ChatMessage save(ChatMessage message) {
        if (message.getId() == null) {
            message.setId(idCounter.incrementAndGet());
        }
        messages.put(message.getId(), message);
        return message;
    }

    public List<ChatMessage> findAllByTaskId(Long taskId) {
        return messages.values().stream()
                .filter(message -> message.getTaskId().equals(taskId))
                .collect(Collectors.toList());
    }

    public void deleteByTaskId(Long taskId) {
        messages.values().removeIf(message -> message.getTaskId().equals(taskId));
    }
} 