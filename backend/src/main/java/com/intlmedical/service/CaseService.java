package com.intlmedical.service;

import com.intlmedical.dto.response.CaseVO;
import com.intlmedical.mapper.CaseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CaseService {

    private final CaseMapper caseMapper;

    public List<CaseVO> listActive() {
        return caseMapper.selectActiveWithHospital();
    }
}
