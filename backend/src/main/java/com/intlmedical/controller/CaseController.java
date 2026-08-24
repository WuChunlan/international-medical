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
    public Result<List<CaseVO>> list(@RequestParam(defaultValue = "zh") String lang) {
        return Result.ok(caseService.listActive(lang));
    }

    @GetMapping("/{id}")
    public Result<CaseVO> detail(@PathVariable Long id,
                                 @RequestParam(defaultValue = "zh") String lang) {
        CaseVO vo = caseService.getActiveById(id, lang);
        if (vo == null) {
            return Result.fail(404, "案例不存在");
        }
        return Result.ok(vo);
    }

    @GetMapping("/by-hospital/{hospitalId}")
    public Result<List<CaseVO>> listByHospital(
            @PathVariable Long hospitalId,
            @RequestParam(defaultValue = "zh") String lang) {
        return Result.ok(caseService.listActiveByHospital(hospitalId, lang));
    }
}
