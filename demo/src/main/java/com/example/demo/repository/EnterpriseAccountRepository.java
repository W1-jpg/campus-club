package com.example.demo.repository;

import com.example.demo.entity.EnterpriseAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnterpriseAccountRepository extends JpaRepository<EnterpriseAccount, Long> {
    EnterpriseAccount findByEnterpriseId(Long enterpriseId);
    EnterpriseAccount findByUsername(String username);
}
