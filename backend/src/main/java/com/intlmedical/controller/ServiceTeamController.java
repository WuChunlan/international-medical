package com.intlmedical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.ServiceTeam;
import com.intlmedical.mapper.ServiceTeamMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-teams")
@RequiredArgsConstructor
public class ServiceTeamController {

    private final ServiceTeamMapper serviceTeamMapper;

    @GetMapping
    public Result<List<ServiceTeam>> list() {
        List<ServiceTeam> list = serviceTeamMapper.selectList(
            new LambdaQueryWrapper<ServiceTeam>()
                .eq(ServiceTeam::getIsActive, 1)
                .orderByAsc(ServiceTeam::getSortOrder)
        );
        return Result.ok(list);
    }
}
