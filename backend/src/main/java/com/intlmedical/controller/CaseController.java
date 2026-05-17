package com.intlmedical.controller;

import com.intlmedical.entity.Case;
import com.intlmedical.service.CaseService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService caseService;

    @GetMapping
    public Result<List<Case>> list() {
        return Result.ok(caseService.listActive());
    }
}
