package com.intlmedical.controller;

import com.intlmedical.entity.BrowseHistory;
import com.intlmedical.service.BrowseHistoryService;
import com.intlmedical.util.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final BrowseHistoryService browseHistoryService;

    @GetMapping("/history")
    public Result<List<BrowseHistory>> history(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return Result.ok(browseHistoryService.listByUser(userId));
    }

    @PostMapping("/history")
    public Result<Void> record(@RequestBody HistoryRequest req, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        browseHistoryService.record(userId, req.getTargetType(), req.getTargetId());
        return Result.ok();
    }

    @Data
    static class HistoryRequest {
        private String targetType;
        private Long targetId;
    }
}
