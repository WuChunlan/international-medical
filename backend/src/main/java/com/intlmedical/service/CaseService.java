package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.Case;
import com.intlmedical.mapper.CaseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CaseService {

    private final CaseMapper caseMapper;

    public List<Case> listActive() {
        return caseMapper.selectList(
            new LambdaQueryWrapper<Case>()
                .eq(Case::getIsActive, 1)
                .orderByAsc(Case::getSortOrder)
        );
    }
}
