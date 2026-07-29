package com.intlmedical.controller;

import com.intlmedical.dto.response.CaseVO;
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
    public Result<List<CaseVO>> list() {
        return Result.ok(caseService.listActive());
    }

    @GetMapping("/{id}")
    public Result<CaseVO> detail(@PathVariable Long id) {
        CaseVO vo = caseService.getActiveById(id);
        if (vo == null) {
            return Result.fail(404, "案例不存在");
        }
        return Result.ok(vo);
    }
}
