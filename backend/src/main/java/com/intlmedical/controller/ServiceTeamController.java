package com.intlmedical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.ServiceTeam;
import com.intlmedical.mapper.ServiceTeamMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-teams")
@RequiredArgsConstructor
public class ServiceTeamController {

    private final ServiceTeamMapper serviceTeamMapper;
    private final ContentTranslationService translationService;

    private static final List<String> BUILTIN_LANGS = List.of("zh", "en");

    @GetMapping
    public Result<List<ServiceTeam>> list(@RequestParam(defaultValue = "zh") String lang) {
        List<ServiceTeam> list = serviceTeamMapper.selectList(
            new LambdaQueryWrapper<ServiceTeam>()
                .eq(ServiceTeam::getIsActive, 1)
                .orderByAsc(ServiceTeam::getSortOrder)
        );
        if (!BUILTIN_LANGS.contains(lang)) {
            list.forEach(t -> t.setTranslations(
                translationService.getAll("service_team", t.getId(), lang)
            ));
        }
        return Result.ok(list);
    }
}
